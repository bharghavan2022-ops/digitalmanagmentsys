import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LiveTokenProjector } from "./live-token-projector";

export default async function EventMonitorPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  const verifiedCount = await prisma.attendance.count({
    where: { eventId: event.id, state: "VERIFIED_ATTENDED" },
  });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-black p-8 text-white">
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <LiveTokenProjector eventId={event.id} />
      <p className="text-sm text-white/70">{verifiedCount} verified so far</p>
    </main>
  );
}
