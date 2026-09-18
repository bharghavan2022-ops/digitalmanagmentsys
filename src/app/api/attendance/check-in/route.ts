import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { checkInSchema } from "@/lib/validators/attendance";
import { verifyCheckInToken } from "@/lib/attendance/token";
import { haversineDistanceMeters } from "@/lib/attendance/geo";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers can check in to an event");
    }

    const body = checkInSchema.parse(await request.json());

    if (!verifyCheckInToken(body.token, body.eventId)) {
      return NextResponse.json({ error: "Check-in token is invalid or expired" }, { status: 400 });
    }

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Geo is advisory: recorded for admin review, never a hard block (see
    // open decision #2 in PROJECT_CONTEXT.md).
    let geoDistanceMeters: number | undefined;
    if (
      body.latitude != null &&
      body.longitude != null &&
      event.latitude != null &&
      event.longitude != null
    ) {
      geoDistanceMeters = haversineDistanceMeters(
        { latitude: body.latitude, longitude: body.longitude },
        { latitude: event.latitude, longitude: event.longitude },
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: { eventId_volunteerId: { eventId: event.id, volunteerId: volunteer.id } },
      create: {
        eventId: event.id,
        volunteerId: volunteer.id,
        state: "VERIFIED_ATTENDED",
        checkedInAt: new Date(),
        verifiedByUserId: user.id,
        geoDistanceMeters,
      },
      update: {
        state: "VERIFIED_ATTENDED",
        checkedInAt: new Date(),
        verifiedByUserId: user.id,
        geoDistanceMeters,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ATTENDANCE_VERIFIED",
        resourceType: "Attendance",
        resourceId: attendance.id,
        stateDiff: { eventId: event.id, volunteerId: volunteer.id, geoDistanceMeters },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return toErrorResponse(error, "attendance.checkIn");
  }
}
