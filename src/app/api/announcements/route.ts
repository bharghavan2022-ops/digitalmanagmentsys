import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/error-response";
import { createAnnouncementSchema } from "@/lib/validators/announcement";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    const announcements = await prisma.announcement.findMany({
      where: { OR: [{ audience: null }, { audience: user.role }] },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    return toErrorResponse(error, "announcements.list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["COORDINATOR"]);
    const body = createAnnouncementSchema.parse(await request.json());

    const announcement = await prisma.announcement.create({
      data: { ...body, createdById: user.id },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "announcements.create");
  }
}
