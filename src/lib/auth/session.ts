import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@prisma/client";
import { createVolunteerSchema } from "@/lib/validators/volunteer";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  isLead: boolean;
  lastSeenAnnouncementsAt: Date | null;
};

/**
 * Resolves the authenticated Supabase session to its corresponding `User`
 * row. Returns null when there is no session or the row hasn't been synced
 * yet - callers decide how to handle that (redirect vs. 401).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser || !authUser.email) return null;

  // Lazily syncs the Supabase auth user to our `User` row on first access,
  // since this project has no DB trigger/webhook wiring that auth up yet.
  // New rows default to VOLUNTEER; promoting to COORDINATOR/AUDITOR is a
  // deliberate admin action, not something this sync ever does.
  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: { id: authUser.id, email: authUser.email },
  });

  // The register page submits the volunteer's profile fields as Supabase
  // auth user metadata rather than creating the profile directly, because
  // Supabase can require email confirmation before a session exists - the
  // authenticated POST /api/volunteers call would fail with no session to
  // send. Once a session does exist (first request after sign-up or after
  // confirming), create the missing profile from that metadata here.
  if (user.role === "VOLUNTEER") {
    const hasProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!hasProfile) {
      const parsed = createVolunteerSchema.safeParse(authUser.user_metadata);
      if (parsed.success) {
        await prisma.volunteerProfile.create({
          data: {
            userId: user.id,
            nssId: `PENDING-${user.id.slice(0, 8)}`,
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            department: parsed.data.department,
            yearOfStudy: parsed.data.yearOfStudy,
            status: "APPLIED",
          },
        });
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isLead: user.isLead,
    lastSeenAnnouncementsAt: user.lastSeenAnnouncementsAt,
  };
}
