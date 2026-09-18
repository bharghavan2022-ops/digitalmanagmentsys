import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/error-response";
import { createVolunteerSchema } from "@/lib/validators/volunteer";
import { paginationSchema, paginatedResponse, toSkipTake } from "@/lib/validators/pagination";

const listQuerySchema = paginationSchema.extend({
  status: z.enum(["APPLIED", "ACTIVE", "INACTIVE", "ALUMNI"]).optional(),
  search: z.string().trim().min(1).optional(),
});

// Admin roster: paginated, optionally filtered by status and/or a search
// term matched against name, NSS ID, and department.
export async function GET(request: NextRequest) {
  try {
    await requireRole(["COORDINATOR", "AUDITOR"]);

    const searchParams = request.nextUrl.searchParams;
    const query = listQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const where: Prisma.VolunteerProfileWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { nssId: { contains: query.search, mode: "insensitive" } },
              { department: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [volunteers, total] = await Promise.all([
      prisma.volunteerProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
        ...toSkipTake(query),
      }),
      prisma.volunteerProfile.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(volunteers, total, query));
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
