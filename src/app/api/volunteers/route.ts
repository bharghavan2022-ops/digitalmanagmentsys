import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/error-response";
import { createVolunteerSchema } from "@/lib/validators/volunteer";

// Admin roster: list all volunteers.
export async function GET() {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);
    const volunteers = await prisma.volunteerProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    });
    return NextResponse.json(volunteers);
  } catch (error) {
    return toErrorResponse(error, "volunteers.list");
  }
}

// Self-service registration: an already-authenticated VOLUNTEER user
// completes their profile. NSS ID is assigned separately on approval.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers can self-register");
    }

    const body = createVolunteerSchema.parse(await request.json());

    const volunteer = await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        nssId: `PENDING-${user.id.slice(0, 8)}`,
        fullName: body.fullName,
        phone: body.phone,
        department: body.department,
        yearOfStudy: body.yearOfStudy,
        status: "APPLIED",
      },
    });

    return NextResponse.json(volunteer, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "volunteers.create");
  }
}
