import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  isLead: boolean;
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

  return { id: user.id, email: user.email, role: user.role, isLead: user.isLead };
}
