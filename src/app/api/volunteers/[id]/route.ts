import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { adminUpdateVolunteerSchema } from "@/lib/validators/volunteer";
import { generateNssId } from "@/lib/volunteers/nss-id";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, isLead: true } } },
    });
    if (!volunteer) return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });

    return NextResponse.json(volunteer);
  } catch (error) {
    return toErrorResponse(error, "volunteers.get");
  }
}

// Admin-only: approve/change a volunteer's status and/or designate them as a
// unit lead. Approving APPLIED -> ACTIVE assigns a permanent NSS ID,
// replacing the PENDING-* placeholder set at self-registration.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["COORDINATOR"]);
    const body = adminUpdateVolunteerSchema.parse(await request.json());

    const existing = await prisma.volunteerProfile.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      const data: Prisma.VolunteerProfileUpdateInput = {};

      if (body.status) {
        data.status = body.status;
        if (body.status === "ACTIVE" && existing.nssId.startsWith("PENDING-")) {
          data.nssId = await generateNssId(tx, existing.department);
        }
      }

      const volunteer = await tx.volunteerProfile.update({ where: { id: existing.id }, data });

      if (body.isLead !== undefined) {
        await tx.user.update({ where: { id: existing.userId }, data: { isLead: body.isLead } });
      }

      return volunteer;
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "VOLUNTEER_UPDATED",
        resourceType: "VolunteerProfile",
        resourceId: existing.id,
        stateDiff: body,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "NSS ID assignment collided with a concurrent approval, please retry" },
        { status: 409 },
      );
    }
    return toErrorResponse(error, "volunteers.update");
  }
}
