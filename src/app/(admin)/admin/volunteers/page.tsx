import type { Prisma, VolunteerStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/shared/pager";
import { VolunteerRosterTable, type RosterRow } from "./roster-table";

const PAGE_SIZE = 20;
const STATUSES: VolunteerStatus[] = ["APPLIED", "ACTIVE", "INACTIVE", "ALUMNI"];

export default async function AdminVolunteersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  const user = await getCurrentUser();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search?.trim();
  const status = STATUSES.includes(searchParams.status as VolunteerStatus)
    ? (searchParams.status as VolunteerStatus)
    : undefined;

  const where: Prisma.VolunteerProfileWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { nssId: { contains: search, mode: "insensitive" } },
            { department: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [volunteers, total] = await Promise.all([
    prisma.volunteerProfile.findMany({
      where,
      include: { user: { select: { email: true, isLead: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.volunteerProfile.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

      <form className="flex flex-wrap items-end gap-3" action="/admin/volunteers" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Search
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Name, NSS ID, department"
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {/* AUDITOR sees the same roster with no action buttons - the PATCH
          route also rejects them server-side regardless. */}
      <VolunteerRosterTable data={rows} canManage={user?.role === "COORDINATOR"} />

      <Pager
        basePath="/admin/volunteers"
        page={page}
        totalPages={totalPages}
        searchParams={{ search, status }}
      />
    </main>
  );
}
