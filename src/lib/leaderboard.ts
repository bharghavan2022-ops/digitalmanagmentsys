export type LeaderboardRow = {
  volunteerId: string;
  fullName: string;
  department: string;
  hours: number;
};

/**
 * Pure ranking/filtering step over already-aggregated hours-per-volunteer
 * rows, kept separate from the Prisma query that produces them so the
 * ranking logic itself is unit-testable without a database.
 */
export function computeLeaderboard(
  rows: LeaderboardRow[],
  options: { department?: string; limit?: number } = {},
): LeaderboardRow[] {
  const filtered = options.department
    ? rows.filter((row) => row.department === options.department)
    : rows;

  return [...filtered].sort((a, b) => b.hours - a.hours).slice(0, options.limit ?? 10);
}
