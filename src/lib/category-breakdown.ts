export type CategoryBreakdownEntry = {
  category: string;
  hours: number;
  percent: number;
};

/**
 * Groups verified-attendance hours by event category. Takes plain
 * {category, hours} pairs (one per verified attendance) rather than Prisma
 * rows directly, so it stays a pure function callers can unit test without
 * a database.
 */
export function computeCategoryBreakdown(
  entries: Array<{ category: string; hours: number }>,
): CategoryBreakdownEntry[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.hours);
  }

  const totalHours = [...totals.values()].reduce((sum, h) => sum + h, 0);

  return [...totals.entries()]
    .map(([category, hours]) => ({
      category,
      hours,
      percent: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);
}
