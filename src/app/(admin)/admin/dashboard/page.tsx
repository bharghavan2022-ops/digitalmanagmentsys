import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [volunteerCount, eventCount, verifiedAttendanceCount, certificateCount] =
    await Promise.all([
      prisma.volunteerProfile.count({ where: { status: "ACTIVE" } }),
      prisma.event.count(),
      prisma.attendance.count({ where: { state: "VERIFIED_ATTENDED" } }),
      prisma.certificate.count(),
    ]);

  const stats = [
    { label: "Active volunteers", value: volunteerCount },
    { label: "Events", value: eventCount },
    { label: "Verified attendances", value: verifiedAttendanceCount },
    { label: "Certificates issued", value: certificateCount },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">NSS impact overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
