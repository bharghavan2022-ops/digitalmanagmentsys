import { describe, it, expect } from "vitest";
import { computeLeaderboard } from "@/lib/leaderboard";

const rows = [
  { volunteerId: "1", fullName: "Aditya", department: "CSE", hours: 40 },
  { volunteerId: "2", fullName: "Sneha", department: "ECE", hours: 55 },
  { volunteerId: "3", fullName: "Rahul", department: "CSE", hours: 20 },
  { volunteerId: "4", fullName: "Divya", department: "IT", hours: 30 },
];

describe("computeLeaderboard", () => {
  it("ranks by hours descending", () => {
    const result = computeLeaderboard(rows);
    expect(result.map((r) => r.volunteerId)).toEqual(["2", "1", "4", "3"]);
  });

  it("filters by department", () => {
    const result = computeLeaderboard(rows, { department: "CSE" });
    expect(result.map((r) => r.volunteerId)).toEqual(["1", "3"]);
  });

  it("limits to the requested count", () => {
    const result = computeLeaderboard(rows, { limit: 2 });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.volunteerId)).toEqual(["2", "1"]);
  });

  it("returns an empty list when no rows match the department filter", () => {
    expect(computeLeaderboard(rows, { department: "MECH" })).toEqual([]);
  });
});
