import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VolunteerDashboardPage() {
  const user = await getCurrentUser();
  const volunteer = await prisma.volunteerProfile.findUnique({
    where: { userId: user!.id },
    include: {
      attendances: {
        where: { state: "VERIFIED_ATTENDED" },
        include: { event: { select: { awardedHours: true } } },
      },
      registrations: {
        include: { event: true },
        where: { event: { startTime: { gte: new Date() } } },
        orderBy: { event: { startTime: "asc" } },
        take: 3,
      },
    },
  });

  const verifiedHours =
    volunteer?.attendances.reduce((sum, a) => sum + Number(a.event.awardedHours), 0) ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Welcome back{volunteer ? `, ${volunteer.fullName}` : ""}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verified hours</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{verifiedHours}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="text-lg">{volunteer?.status ?? "APPLIED"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming registered events</CardTitle>
        </CardHeader>
        <CardContent>
          {volunteer && volunteer.registrations.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {volunteer.registrations.map((r) => (
                <li key={r.id} className="text-sm">
                  {r.event.title} - {r.event.startTime.toISOString().slice(0, 10)}
                  {r.waitlisted && <span className="ml-2 text-muted-foreground">(waitlisted)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming registrations.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
