import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterButton } from "./register-button";
import { FeedbackForm } from "./feedback-form";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { _count: { select: { registrations: { where: { waitlisted: false } } } } },
  });
  if (!event) notFound();

  const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user!.id } });
  const existingRegistration = volunteer
    ? await prisma.eventRegistration.findUnique({
        where: { eventId_volunteerId: { eventId: event.id, volunteerId: volunteer.id } },
      })
    : null;

  const attendance = volunteer
    ? await prisma.attendance.findUnique({
        where: { eventId_volunteerId: { eventId: event.id, volunteerId: volunteer.id } },
      })
    : null;
  const existingFeedback = volunteer
    ? await prisma.feedback.findUnique({
        where: { eventId_volunteerId: { eventId: event.id, volunteerId: volunteer.id } },
      })
    : null;

  const isFull =
    event.maxCapacity != null && event._count.registrations >= event.maxCapacity;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">{event.description}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Venue</dt>
            <dd>{event.venueName}</dd>
            <dt className="text-muted-foreground">Starts</dt>
            <dd>{event.startTime.toISOString().slice(0, 16).replace("T", " ")}</dd>
            <dt className="text-muted-foreground">Hours awarded</dt>
            <dd>{Number(event.awardedHours)}</dd>
          </dl>
          <RegisterButton
            eventId={event.id}
            alreadyRegistered={Boolean(existingRegistration)}
            waitlisted={existingRegistration?.waitlisted ?? false}
            isFull={isFull}
          />
        </CardContent>
      </Card>

      {attendance?.state === "VERIFIED_ATTENDED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackForm
              eventId={event.id}
              existingRating={existingFeedback?.rating ?? null}
              existingMessage={existingFeedback?.message ?? null}
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
