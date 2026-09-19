import { describe, it, expect } from "vitest";
import { computeParticipationRate, computeMonthlyParticipation } from "@/lib/participation";

describe("computeParticipationRate", () => {
  it("computes a rounded percentage", () => {
    expect(computeParticipationRate(10, 3)).toBe(30);
    expect(computeParticipationRate(3, 1)).toBe(33);
  });

  it("returns 0 rather than dividing by zero when there are no active volunteers", () => {
    expect(computeParticipationRate(0, 0)).toBe(0);
  });
});

describe("computeMonthlyParticipation", () => {
  const now = new Date(Date.UTC(2026, 8, 15)); // Sept 2026

  it("includes months with zero check-ins rather than skipping them", () => {
    const result = computeMonthlyParticipation([], 3, now);
    expect(result).toEqual([
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 0 },
      { month: "2026-09", count: 0 },
    ]);
  });

  it("buckets check-ins into the correct calendar month", () => {
    const result = computeMonthlyParticipation(
      [
        new Date(Date.UTC(2026, 7, 3)),
        new Date(Date.UTC(2026, 7, 20)),
        new Date(Date.UTC(2026, 8, 1)),
      ],
      3,
      now,
    );
    expect(result).toEqual([
      { month: "2026-07", count: 0 },
      { month: "2026-08", count: 2 },
      { month: "2026-09", count: 1 },
    ]);
  });

  it("ignores check-ins outside the requested window", () => {
    const result = computeMonthlyParticipation([new Date(Date.UTC(2025, 0, 1))], 2, now);
    expect(result.reduce((sum, p) => sum + p.count, 0)).toBe(0);
  });
});
