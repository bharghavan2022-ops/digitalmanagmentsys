import { describe, expect, it } from "vitest";
import { computeCategoryBreakdown } from "@/lib/category-breakdown";

describe("computeCategoryBreakdown", () => {
  it("returns an empty array for no entries", () => {
    expect(computeCategoryBreakdown([])).toEqual([]);
  });

  it("sums hours per category and computes percentages", () => {
    const result = computeCategoryBreakdown([
      { category: "Environment", hours: 8 },
      { category: "Health", hours: 4 },
      { category: "Environment", hours: 4 },
    ]);
    expect(result).toEqual([
      { category: "Environment", hours: 12, percent: 75 },
      { category: "Health", hours: 4, percent: 25 },
    ]);
  });

  it("sorts descending by hours", () => {
    const result = computeCategoryBreakdown([
      { category: "A", hours: 1 },
      { category: "B", hours: 5 },
    ]);
    expect(result.map((r) => r.category)).toEqual(["B", "A"]);
  });
});
