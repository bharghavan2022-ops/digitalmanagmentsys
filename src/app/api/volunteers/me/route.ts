import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { selfUpdateVolunteerSchema } from "@/lib/validators/volunteer";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 });

    return NextResponse.json(volunteer);
  } catch (error) {
    return toErrorResponse(error, "volunteers.me.get");
  }
}

// A volunteer editing their own extended profile fields. Deliberately a
// narrower schema than the admin PATCH route - status, isLead, and nssId
// are not reachable here no matter what the request body contains.
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers have a volunteer profile to edit");
    }

    const body = selfUpdateVolunteerSchema.parse(await request.json());

    const volunteer = await prisma.volunteerProfile.update({
      where: { userId: user.id },
      data: body,
    });

    return NextResponse.json(volunteer);
  } catch (error) {
    return toErrorResponse(error, "volunteers.me.update");
  }
}
