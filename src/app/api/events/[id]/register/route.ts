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
