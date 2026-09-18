import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/error-response";
import { createEventSchema } from "@/lib/validators/event";
import { paginationSchema, paginatedResponse, toSkipTake } from "@/lib/validators/pagination";

const listQuerySchema = paginationSchema.extend({
  status: z.enum(["DRAFT", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  category: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const searchParams = request.nextUrl.searchParams;
    const query = listQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });

    const where: Prisma.EventWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({ where, orderBy: { startTime: "asc" }, ...toSkipTake(query) }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(events, total, query));
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
