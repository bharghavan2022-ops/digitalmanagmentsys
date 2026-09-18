import { prisma } from "@/lib/prisma";

export async function markAnnouncementsSeen(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAnnouncementsAt: new Date() },
  });
}
