import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";

export type WriteAuditLogInput = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  stateDiff?: Prisma.InputJsonValue;
};

function computeHash(params: {
  previousHash: string | null;
  sequence: number;
  createdAt: Date;
  input: WriteAuditLogInput;
}): string {
  const payload = JSON.stringify({
    previousHash: params.previousHash,
    sequence: params.sequence,
    createdAt: params.createdAt.toISOString(),
    userId: params.input.userId ?? null,
    action: params.input.action,
    resourceType: params.input.resourceType,
    resourceId: params.input.resourceId,
    stateDiff: params.input.stateDiff ?? null,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Appends a row to the tamper-evident audit chain. Must run inside the same
 * transaction as the operation it records, so a rollback of the operation
 * also rolls back its audit row. Reads the last row's hash and sequence,
 * then writes a new row whose hash covers its own fields plus that
 * previous hash - editing or deleting any historical row breaks every
 * hash computed after it, which is what makes the chain tamper-evident
 * (not a distributed ledger - see PROJECT_CONTEXT.md for why that's out of
 * scope). The `sequence` unique constraint is the concurrency guard: two
 * concurrent writers computing the same next sequence causes one to fail
 * with a unique-violation rather than silently overwrite.
 */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: WriteAuditLogInput,
) {
  const last = await tx.auditLog.findFirst({ orderBy: { sequence: "desc" } });
  const sequence = (last?.sequence ?? 0) + 1;
  const createdAt = new Date();
  const hash = computeHash({ previousHash: last?.hash ?? null, sequence, createdAt, input });

  return tx.auditLog.create({
    data: {
      sequence,
      previousHash: last?.hash ?? null,
      hash,
      createdAt,
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      stateDiff: input.stateDiff,
    },
  });
}

/** Recomputes every row's hash and compares to what's stored - a mismatch
 * anywhere means that row or an earlier one was altered outside this
 * helper. Used by the admin audit view, not by any write path. */
export async function verifyAuditChain(
  rows: Array<{
    sequence: number;
    previousHash: string | null;
    hash: string;
    createdAt: Date;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    stateDiff: unknown;
  }>,
): Promise<{ valid: boolean; brokenAtSequence: number | null }> {
  const ordered = [...rows].sort((a, b) => a.sequence - b.sequence);
  let previousHash: string | null = null;
  for (const row of ordered) {
    // Two checks, not one: the row's hash must match its own declared
    // fields (catches an edited row), AND its declared previousHash must
    // match the actual previous row in this sequence (catches a row
    // spliced out or reordered - editing a row alone wouldn't break this
    // second check on its own, which is exactly why both are needed).
    if (row.previousHash !== previousHash) {
      return { valid: false, brokenAtSequence: row.sequence };
    }

    const expected = computeHash({
      previousHash: row.previousHash,
      sequence: row.sequence,
      createdAt: row.createdAt,
      input: {
        userId: row.userId,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        stateDiff: row.stateDiff as Prisma.InputJsonValue,
      },
    });
    if (expected !== row.hash) {
      return { valid: false, brokenAtSequence: row.sequence };
    }
    previousHash = row.hash;
  }
  return { valid: true, brokenAtSequence: null };
}
