import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";

// Volunteer self-registration for an event. Capacity is enforced here, not
// only in the UI: once maxCapacity is reached, later registrations are
// waitlisted rather than rejected.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers can register for events");
    }

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const registration = await prisma.$transaction(async (tx) => {
      const confirmedCount = await tx.eventRegistration.count({
        where: { eventId: event.id, waitlisted: false },
      });
      const waitlisted = event.maxCapacity != null && confirmedCount >= event.maxCapacity;

      return tx.eventRegistration.create({
        data: { eventId: event.id, volunteerId: volunteer.id, waitlisted },
      });
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 });
    }
    return toErrorResponse(error, "events.register");
  }
}

// Cancels the current volunteer's own registration. If they held a
// confirmed (non-waitlisted) seat, the earliest-registered waitlisted
// volunteer is promoted into it in the same transaction, so a cancellation
// never leaves a seat empty while someone is waiting.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers can cancel their own registration");
    }

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_volunteerId: { eventId: params.id, volunteerId: volunteer.id } },
    });
    if (!existing) {
      return NextResponse.json({ error: "You are not registered for this event" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.delete({ where: { id: existing.id } });

      if (!existing.waitlisted) {
        const nextInLine = await tx.eventRegistration.findFirst({
          where: { eventId: params.id, waitlisted: true },
          orderBy: { registeredAt: "asc" },
        });
        if (nextInLine) {
          await tx.eventRegistration.update({
            where: { id: nextInLine.id },
            data: { waitlisted: false },
          });
        }
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "events.unregister");
  }
}
