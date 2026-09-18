import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { renderGatePassPdf } from "@/lib/gate-pass/generate";

// Only the volunteer holding a confirmed (non-waitlisted) registration for
// this event can download its gate pass.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers hold gate passes");
    }

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const [event, registration] = await Promise.all([
      prisma.event.findUnique({ where: { id: params.id } }),
      prisma.eventRegistration.findUnique({
        where: { eventId_volunteerId: { eventId: params.id, volunteerId: volunteer.id } },
      }),
    ]);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!registration || registration.waitlisted) {
      return NextResponse.json(
        { error: "A gate pass is only available for a confirmed registration" },
        { status: 400 },
      );
    }

    const pdfBytes = await renderGatePassPdf({
      eventTitle: event.title,
      venueName: event.venueName,
      startTime: event.startTime,
      volunteerName: volunteer.fullName,
      nssId: volunteer.nssId,
      awardedHours: Number(event.awardedHours),
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="gate-pass-${event.id}.pdf"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "events.gatePass");
  }
}
