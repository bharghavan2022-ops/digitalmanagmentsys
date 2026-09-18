import { prisma } from "@/lib/prisma";
import type { AppRole } from "@prisma/client";

export async function getUnreadAnnouncementCount(
  role: AppRole,
  lastSeenAt: Date | null,
): Promise<number> {
  return prisma.announcement.count({
    where: {
      OR: [{ audience: null }, { audience: role }],
      ...(lastSeenAt ? { createdAt: { gt: lastSeenAt } } : {}),
    },
  });
}
