import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeParticipationRate, computeMonthlyParticipation } from "@/lib/participation";
import { computeLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";
import { ParticipationChart } from "./participation-chart";

export default async function AdminDashboardPage() {
  const [volunteerCount, eventCount, verifiedAttendanceCount, certificateCount, verifiedAttendances] =
    await Promise.all([
      prisma.volunteerProfile.count({ where: { status: "ACTIVE" } }),
      prisma.event.count(),
      prisma.attendance.count({ where: { state: "VERIFIED_ATTENDED" } }),
      prisma.certificate.count(),
      // Single query, not one per volunteer: everything the leaderboard,
      // participation rate, and monthly chart need comes from this one join.
      prisma.attendance.findMany({
        where: { state: "VERIFIED_ATTENDED" },
        select: {
          volunteerId: true,
          checkedInAt: true,
          volunteer: { select: { fullName: true, department: true } },
          event: { select: { awardedHours: true } },
        },
      }),
    ]);

  const hoursByVolunteer = new Map<string, LeaderboardRow>();
  const participatingVolunteerIds = new Set<string>();
  for (const a of verifiedAttendances) {
    participatingVolunteerIds.add(a.volunteerId);
    const existing = hoursByVolunteer.get(a.volunteerId);
    const hours = Number(a.event.awardedHours);
    if (existing) {
      existing.hours += hours;
    } else {
      hoursByVolunteer.set(a.volunteerId, {
        volunteerId: a.volunteerId,
        fullName: a.volunteer.fullName,
        department: a.volunteer.department,
        hours,
      });
    }
  }

  const leaderboard = computeLeaderboard([...hoursByVolunteer.values()], { limit: 10 });
  const participationRate = computeParticipationRate(
    volunteerCount,
    participatingVolunteerIds.size,
  );
  const monthlyParticipation = computeMonthlyParticipation(
    verifiedAttendances.map((a) => a.checkedInAt).filter((d): d is Date => d !== null),
    6,
  );

  const stats = [
    { label: "Active volunteers", value: volunteerCount },
    { label: "Events", value: eventCount },
    { label: "Verified attendances", value: verifiedAttendanceCount },
    { label: "Certificates issued", value: certificateCount },
    { label: "Participation rate", value: `${participationRate}%` },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">NSS impact overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participation, last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipationChart data={monthlyParticipation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard - top volunteers by verified hours</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-2">Volunteer</th>
                  <th className="py-1.5 pr-2">Department</th>
                  <th className="py-1.5 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.volunteerId} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-1.5 pr-2">{row.fullName}</td>
                    <td className="py-1.5 pr-2">{row.department}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No verified attendance yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
