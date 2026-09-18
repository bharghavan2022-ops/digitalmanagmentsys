import Link from "next/link";
import type { EventStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pager } from "@/components/shared/pager";

const PAGE_SIZE = 12;
const STATUSES: EventStatus[] = ["DRAFT", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"];

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const user = await getCurrentUser();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = STATUSES.includes(searchParams.status as EventStatus)
    ? (searchParams.status as EventStatus)
    : undefined;

  const where: Prisma.EventWhereInput = status ? { status } : {};

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: { _count: { select: { registrations: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        {user?.role === "COORDINATOR" && (
          <Button asChild>
            <Link href="/admin/events/create">New event</Link>
          </Button>
        )}
      </div>

      <form className="flex items-end gap-3" action="/admin/events" method="get">
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

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="text-base">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>{event.status}</span>
              <span>{event._count.registrations} registered</span>
              <Link
                href={`/admin/events/${event.id}/monitor`}
                className="underline underline-offset-4"
              >
                Open live monitor
              </Link>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No events match this filter.</p>
        )}
      </div>

      <Pager basePath="/admin/events" page={page} totalPages={totalPages} searchParams={{ status }} />
    </main>
  );
}
