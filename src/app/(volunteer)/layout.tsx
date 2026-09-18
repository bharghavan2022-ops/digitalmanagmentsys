import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUnreadAnnouncementCount } from "@/lib/announcements/unread-count";
import { AppShell } from "@/components/shared/app-shell";

export default async function VolunteerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "VOLUNTEER") redirect("/admin/dashboard");

  const unreadAnnouncements = await getUnreadAnnouncementCount(
    user.role,
    user.lastSeenAnnouncementsAt,
  );

  return (
    <AppShell
      variant="volunteer"
      email={user.email}
      role={user.role}
      isLead={user.isLead}
      unreadAnnouncements={unreadAnnouncements}
    >
      {children}
    </AppShell>
  );
}
