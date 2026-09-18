import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { VolunteerRosterTable, type RosterRow } from "./roster-table";

export default async function AdminVolunteersPage() {
  const user = await getCurrentUser();
  const volunteers = await prisma.volunteerProfile.findMany({
    include: { user: { select: { email: true, isLead: true } } },
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
    isLead: v.user.isLead,
    totalHoursServed: Number(v.totalHoursServed),
  }));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Volunteer roster</h1>
      {/* AUDITOR sees the same roster with no action buttons - the PATCH
          route also rejects them server-side regardless. */}
      <VolunteerRosterTable data={rows} canManage={user?.role === "COORDINATOR"} />
    </main>
  );
}
