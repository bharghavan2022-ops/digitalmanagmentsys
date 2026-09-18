import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { markAnnouncementsSeen } from "@/lib/announcements/mark-seen";

// Marks every announcement visible to the current user as read, by
// bumping a single timestamp rather than tracking per-announcement rows -
// "unread count" is just announcements created after this moment.
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");

    await markAnnouncementsSeen(user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error, "announcements.markSeen");
  }
}
