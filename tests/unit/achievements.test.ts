import { describe, expect, it } from "vitest";
import { computeAchievements } from "@/lib/achievements";

describe("computeAchievements", () => {
  it("unlocks nothing for a fresh volunteer with no verified attendance", () => {
    const badges = computeAchievements({ verifiedHours: 0, verifiedAttendanceCount: 0, isLead: false });
    expect(badges.every((b) => !b.unlocked)).toBe(true);
  });

  it("unlocks first-service and hour milestones as thresholds are crossed", () => {
    const badges = computeAchievements({
      verifiedHours: 25,
      verifiedAttendanceCount: 3,
      isLead: false,
    });
    const byId = Object.fromEntries(badges.map((b) => [b.id, b.unlocked]));
    expect(byId["first-service"]).toBe(true);
    expect(byId["ten-hours"]).toBe(true);
    expect(byId["twenty-five-hours"]).toBe(true);
    expect(byId["fifty-hours"]).toBe(false);
  });

  it("unlocks the unit-lead badge only from the isLead flag", () => {
    const badges = computeAchievements({ verifiedHours: 0, verifiedAttendanceCount: 0, isLead: true });
    expect(badges.find((b) => b.id === "unit-lead")?.unlocked).toBe(true);
  });
});
