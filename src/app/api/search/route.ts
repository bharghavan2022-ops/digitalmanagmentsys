import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { searchQuerySchema } from "@/lib/validators/search";

const RESULT_LIMIT = 5;

// Scoped by role rather than one global index: a volunteer searches events
// they can browse plus their own certificates; admins additionally search
// the volunteer roster. Nothing here searches across another volunteer's
// private data.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const { q } = searchQuerySchema.parse({ q: request.nextUrl.searchParams.get("q") });

    const events = await prisma.event.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(user.role === "VOLUNTEER" ? { status: { in: ["UPCOMING", "ACTIVE"] } } : {}),
      },
      select: { id: true, title: true, category: true, startTime: true },
      take: RESULT_LIMIT,
      orderBy: { startTime: "asc" },
    });

    let certificates: { id: string; certificateNo: string }[] = [];
    let volunteers: { id: string; fullName: string; nssId: string }[] = [];

    if (user.role === "VOLUNTEER") {
      const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
      if (volunteer) {
        certificates = await prisma.certificate.findMany({
          where: { volunteerId: volunteer.id, certificateNo: { contains: q, mode: "insensitive" } },
          select: { id: true, certificateNo: true },
          take: RESULT_LIMIT,
        });
      }
    } else {
      volunteers = await prisma.volunteerProfile.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { nssId: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, fullName: true, nssId: true },
        take: RESULT_LIMIT,
      });
    }

    return NextResponse.json({ events, certificates, volunteers });
  } catch (error) {
    return toErrorResponse(error, "search");
  }
}
