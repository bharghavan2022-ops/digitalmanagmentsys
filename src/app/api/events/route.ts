import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/error-response";
import { createEventSchema } from "@/lib/validators/event";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const events = await prisma.event.findMany({ orderBy: { startTime: "asc" } });
    return NextResponse.json(events);
  } catch (error) {
    return toErrorResponse(error, "events.list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["COORDINATOR"]);
    const body = createEventSchema.parse(await request.json());

    const event = await prisma.event.create({
      data: { ...body, createdById: user.id, status: "DRAFT" },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "events.create");
  }
}
