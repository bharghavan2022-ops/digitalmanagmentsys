import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { issueCheckInToken } from "@/lib/attendance/token";

// Issues a signed, ~30s check-in token for the live monitor page to render
// as a rotating QR. COORDINATORs and unit leads (isLead volunteers) may
// issue tokens; plain volunteers may not, even if they are logged in.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "COORDINATOR" && !user.isLead) {
      throw new ForbiddenError("Only coordinators or unit leads can issue check-in tokens");
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(issueCheckInToken(event.id));
  } catch (error) {
    return toErrorResponse(error, "events.token");
  }
}
