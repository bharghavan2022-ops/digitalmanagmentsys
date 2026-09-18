import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUnreadAnnouncementCount } from "@/lib/announcements/unread-count";
import { AppShell } from "@/components/shared/app-shell";

// Coordinators and auditors share this portal; the UI hides mutating
// controls for auditors, but every mutating route also rejects them
// server-side (see requireRole calls in src/app/api/**).
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "COORDINATOR" && user.role !== "AUDITOR") redirect("/dashboard");

  const unreadAnnouncements = await getUnreadAnnouncementCount(
    user.role,
    user.lastSeenAnnouncementsAt,
  );

  return (
    <AppShell
      variant="admin"
      email={user.email}
      role={user.role}
      isLead={user.isLead}
      unreadAnnouncements={unreadAnnouncements}
    >
      {children}
    </AppShell>
  );
}
