export function computeParticipationRate(
  activeVolunteerCount: number,
  participatingVolunteerCount: number,
): number {
  if (activeVolunteerCount <= 0) return 0;
  return Math.round((participatingVolunteerCount / activeVolunteerCount) * 100);
}

export type MonthlyParticipationPoint = { month: string; count: number };

/**
 * Buckets verified check-in timestamps into calendar months (UTC,
 * "YYYY-MM"), for the admin dashboard's participation-over-time chart.
 * Months with zero check-ins still appear (as 0), so a gap in activity is
 * visible rather than silently skipped.
 */
export function computeMonthlyParticipation(
  checkInDates: Date[],
  monthsBack: number,
  now: Date = new Date(),
): MonthlyParticipationPoint[] {
  const buckets = new Map<string, number>();
  const points: MonthlyParticipationPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const date of checkInDates) {
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  for (const [month, count] of buckets) {
    points.push({ month, count });
  }
  return points;
}
