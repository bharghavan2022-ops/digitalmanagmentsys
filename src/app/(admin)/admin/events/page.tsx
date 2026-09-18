import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  const events = await prisma.event.findMany({
    orderBy: { startTime: "desc" },
    include: { _count: { select: { registrations: true } } },
  });

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
          <p className="text-sm text-muted-foreground">No events created yet.</p>
        )}
      </div>
    </main>
  );
}
