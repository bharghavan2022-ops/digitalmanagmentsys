import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";

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
