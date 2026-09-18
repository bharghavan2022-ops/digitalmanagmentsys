import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pager } from "@/components/shared/pager";

const PAGE_SIZE = 8;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string };
}) {
  const user = await getCurrentUser();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.search?.trim();
  const category = searchParams.category?.trim();

  const volunteer = user ? await prisma.volunteerProfile.findUnique({ where: { userId: user.id } }) : null;

  const where: Prisma.EventWhereInput = {
    status: { in: ["UPCOMING", "ACTIVE"] },
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    ...(category ? { category } : {}),
  };

  const [events, total, categories, myRegistrations] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startTime: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where }),
    prisma.event.findMany({ distinct: ["category"], select: { category: true } }),
    volunteer
      ? prisma.eventRegistration.findMany({
          where: { volunteerId: volunteer.id },
          select: { eventId: true, waitlisted: true },
        })
      : [],
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const registrationByEvent = new Map(myRegistrations.map((r) => [r.eventId, r.waitlisted]));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-8">
      <h1 className="font-display text-2xl font-bold">Discover NSS Events</h1>

      <form className="flex flex-wrap items-end gap-3" action="/events" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-sm text-muted-foreground">
            Search
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Event name or cause"
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm text-muted-foreground">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => {
          const waitlisted = registrationByEvent.get(event.id);
          return (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">{event.title}</CardTitle>
                  {waitlisted !== undefined && (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        waitlisted
                          ? "border-warning-border bg-warning-bg text-warning-fg"
                          : "border-success-border bg-success-bg text-success-fg"
                      }`}
                    >
                      {waitlisted ? "Waitlisted" : "Registered"}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span>{event.category}</span>
                  <span>{event.venueName}</span>
                  <span>{event.startTime.toISOString().slice(0, 16).replace("T", " ")}</span>
                  <span>{Number(event.awardedHours)}h awarded</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No events match this filter.</p>
        )}
      </div>

      <Pager basePath="/events" page={page} totalPages={totalPages} searchParams={{ search, category }} />
    </main>
  );
}
