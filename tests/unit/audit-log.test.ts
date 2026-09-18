import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyAuditChain } from "@/lib/audit/log";

type Row = Parameters<typeof verifyAuditChain>[0][number];

// Mirrors writeAuditLog's hash formula exactly (sha256 of the row's own
// fields plus the previous row's hash), so these tests can build a
// self-consistent chain without touching a database.
function computeHash(row: Omit<Row, "hash">): string {
  const payload = JSON.stringify({
    previousHash: row.previousHash,
    sequence: row.sequence,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    stateDiff: row.stateDiff,
  });
  return createHash("sha256").update(payload).digest("hex");
}

function buildValidChain(count: number): Row[] {
  const rows: Row[] = [];
  let previousHash: string | null = null;
  for (let i = 1; i <= count; i++) {
    const base = {
      sequence: i,
      previousHash,
      createdAt: new Date(2026, 0, i),
      userId: "user-1",
      action: "TEST_ACTION",
      resourceType: "Thing",
      resourceId: `thing-${i}`,
      stateDiff: { i },
    };
    const hash = computeHash(base);
    rows.push({ ...base, hash });
    previousHash = hash;
  }
  return rows;
}

describe("verifyAuditChain", () => {
  it("validates an untampered chain", async () => {
    const rows = buildValidChain(5);
    const result = await verifyAuditChain(rows);
    expect(result).toEqual({ valid: true, brokenAtSequence: null });
  });

  it("detects a tampered stateDiff on a historical row", async () => {
    const rows = buildValidChain(5);
    rows[2] = { ...rows[2], stateDiff: { i: "tampered" } };
    const result = await verifyAuditChain(rows);
    expect(result.valid).toBe(false);
    expect(result.brokenAtSequence).toBe(3);
  });

  it("detects a row spliced out of the chain", async () => {
    const rows = buildValidChain(5);
    rows.splice(2, 1); // remove sequence 3; sequence 4's previousHash no longer matches
    const result = await verifyAuditChain(rows);
    expect(result.valid).toBe(false);
  });

  it("is order-independent on input but still finds the earliest break", async () => {
    const rows = buildValidChain(4);
    rows[1] = { ...rows[1], action: "FORGED" };
    const shuffled = [rows[3], rows[0], rows[2], rows[1]];
    const result = await verifyAuditChain(shuffled);
    expect(result.valid).toBe(false);
    expect(result.brokenAtSequence).toBe(2);
  });
});
