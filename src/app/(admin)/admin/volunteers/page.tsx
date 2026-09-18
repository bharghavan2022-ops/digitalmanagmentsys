import { prisma } from "@/lib/prisma";
import { VolunteerRosterTable, type RosterRow } from "./roster-table";

export default async function AdminVolunteersPage() {
  const volunteers = await prisma.volunteerProfile.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: RosterRow[] = volunteers.map((v) => ({
    id: v.id,
    nssId: v.nssId,
    fullName: v.fullName,
    email: v.user.email,
    department: v.department,
    yearOfStudy: v.yearOfStudy,
    status: v.status,
    totalHoursServed: Number(v.totalHoursServed),
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Volunteer roster</h1>
      <VolunteerRosterTable data={rows} />
    </main>
  );
}
