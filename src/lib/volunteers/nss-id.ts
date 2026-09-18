import type { Prisma } from "@prisma/client";

/** NSS-{year}-{deptCode}-{seq}, per PROJECT_CONTEXT.md §7 module 2. */
export function formatNssId(year: number, deptCode: string, sequence: number): string {
  return `NSS-${year}-${deptCode}-${String(sequence).padStart(4, "0")}`;
}

export function deptCodeFor(department: string): string {
  return department.trim().toUpperCase().slice(0, 4) || "GEN";
}

/**
 * Assigns the next NSS ID for a department in the current year. Must run
 * inside the same transaction as the update that consumes it - the count
 * plus the unique constraint on `nssId` is the concurrency guard, the same
 * pattern used for event registration/attendance uniqueness.
 */
export async function generateNssId(
  tx: Prisma.TransactionClient,
  department: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const deptCode = deptCodeFor(department);
  const prefix = `NSS-${year}-${deptCode}-`;

  const count = await tx.volunteerProfile.count({
    where: { nssId: { startsWith: prefix } },
  });

  return formatNssId(year, deptCode, count + 1);
}
