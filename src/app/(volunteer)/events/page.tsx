import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    orderBy: { startTime: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Events</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-base">{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>{event.venueName}</span>
                <span>{event.startTime.toISOString().slice(0, 16).replace("T", " ")}</span>
                <span>{Number(event.awardedHours)}h awarded</span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming events right now.</p>
        )}
      </div>
    </main>
  );
}
