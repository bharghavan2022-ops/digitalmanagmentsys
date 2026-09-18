export type Achievement = {
  id: string;
  label: string;
  unlocked: boolean;
  description: string;
};

/**
 * Every badge here is derived from data that already exists and is already
 * trustworthy (verified attendance count, the same hours total the
 * dashboard and reports use, the isLead flag) - no separate "achievements"
 * table, so there's nothing to fall out of sync.
 */
export function computeAchievements(params: {
  verifiedHours: number;
  verifiedAttendanceCount: number;
  isLead: boolean;
}): Achievement[] {
  const { verifiedHours, verifiedAttendanceCount, isLead } = params;

  return [
    {
      id: "first-service",
      label: "First Service",
      unlocked: verifiedAttendanceCount >= 1,
      description: "Attend your first verified event",
    },
    {
      id: "ten-hours",
      label: "10 Hours Club",
      unlocked: verifiedHours >= 10,
      description: "Reach 10 verified service hours",
    },
    {
      id: "twenty-five-hours",
      label: "25 Hours Milestone",
      unlocked: verifiedHours >= 25,
      description: "Reach 25 verified service hours",
    },
    {
      id: "fifty-hours",
      label: "50 Hour Champion",
      unlocked: verifiedHours >= 50,
      description: "Reach 50 verified service hours",
    },
    {
      id: "unit-lead",
      label: "Unit Lead",
      unlocked: isLead,
      description: "Designated as a unit lead by a coordinator",
    },
  ];
}
