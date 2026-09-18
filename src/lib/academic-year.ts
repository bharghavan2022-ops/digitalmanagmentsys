/**
 * Indian academic years run roughly June-May. A date in Jun-Dec belongs to
 * the year starting that calendar year; Jan-May belongs to the year that
 * started the previous calendar year. Purely a display label - nothing in
 * the schema stores or filters by this, so it's safe to change later
 * without a migration.
 */
export function getAcademicYear(date: Date = new Date()): string {
  const year = date.getUTCMonth() >= 5 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  const shortNextYear = String((year + 1) % 100).padStart(2, "0");
  return `AY ${year}-${shortNextYear}`;
}
