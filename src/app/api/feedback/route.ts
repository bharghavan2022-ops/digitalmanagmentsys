import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { createFeedbackSchema } from "@/lib/validators/feedback";

// Admin view of feedback across events (Communication module).
export async function GET() {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);
    const feedback = await prisma.feedback.findMany({
      include: {
        volunteer: { select: { fullName: true, nssId: true } },
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(feedback);
  } catch (error) {
    return toErrorResponse(error, "feedback.list");
  }
}

// A volunteer may leave one piece of feedback per event they actually
// attended - not just registered for, and not before they were verified.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers can submit feedback");
    }

    const body = createFeedbackSchema.parse(await request.json());

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { eventId_volunteerId: { eventId: body.eventId, volunteerId: volunteer.id } },
    });
    if (!attendance || attendance.state !== "VERIFIED_ATTENDED") {
      return NextResponse.json(
        { error: "Feedback can only be left for events you attended" },
        { status: 400 },
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        eventId: body.eventId,
        volunteerId: volunteer.id,
        rating: body.rating,
        message: body.message,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "You already left feedback for this event" }, { status: 409 });
    }
    return toErrorResponse(error, "feedback.create");
  }
}
