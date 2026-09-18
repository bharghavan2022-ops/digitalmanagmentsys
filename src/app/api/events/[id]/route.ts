import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, requireRole } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { updateEventSchema } from "@/lib/validators/event";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(event);
  } catch (error) {
    return toErrorResponse(error, "events.get");
  }
}

// Coordinator-only: edit event details or move it through its lifecycle
// (DRAFT -> UPCOMING -> ACTIVE -> COMPLETED, or CANCELLED at any point).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole(["COORDINATOR"]);
    const body = updateEventSchema.parse(await request.json());

    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const event = await prisma.$transaction(async (tx) => {
      const record = await tx.event.update({ where: { id: existing.id }, data: body });

      await writeAuditLog(tx, {
        userId: admin.id,
        action: "EVENT_UPDATED",
        resourceType: "Event",
        resourceId: record.id,
        stateDiff: body,
      });

      return record;
    });

    return NextResponse.json(event);
  } catch (error) {
    return toErrorResponse(error, "events.update");
  }
}
