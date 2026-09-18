import { describe, expect, it } from "vitest";
import { getAcademicYear } from "@/lib/academic-year";

describe("getAcademicYear", () => {
  it("returns the current calendar year pair for a date in June or later", () => {
    expect(getAcademicYear(new Date(Date.UTC(2025, 8, 18)))).toBe("AY 2025-26");
    expect(getAcademicYear(new Date(Date.UTC(2025, 5, 1)))).toBe("AY 2025-26");
  });

  it("returns the previous calendar year pair for a date before June", () => {
    expect(getAcademicYear(new Date(Date.UTC(2026, 2, 15)))).toBe("AY 2025-26");
    expect(getAcademicYear(new Date(Date.UTC(2026, 4, 31)))).toBe("AY 2025-26");
  });

  it("wraps the short year across a century boundary", () => {
    expect(getAcademicYear(new Date(Date.UTC(2099, 8, 1)))).toBe("AY 2099-00");
  });
});
