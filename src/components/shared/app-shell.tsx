import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { GlobalSearch } from "@/components/shared/global-search";
import { getAcademicYear } from "@/lib/academic-year";

type NavItem = { href: string; label: string; badge?: number };

const VOLUNTEER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/events", label: "Events" },
  { href: "/attendance/scan", label: "Attendance & Scan" },
  { href: "/certificates", label: "Certificates" },
];
const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/volunteers", label: "Volunteers" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/reports", label: "Reports" },
];

export function AppShell({
  variant,
  email,
  role,
  isLead,
  unreadAnnouncements,
  children,
}: {
  variant: "volunteer" | "admin";
  email: string;
  role: string;
  isLead: boolean;
  unreadAnnouncements: number;
  children: React.ReactNode;
}) {
  const nav = variant === "volunteer" ? VOLUNTEER_NAV : ADMIN_NAV;
  const announcementsHref = variant === "volunteer" ? "/announcements" : "/admin/announcements";
  const profileHref = variant === "volunteer" ? "/profile" : null;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b p-4">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 font-medium hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={announcementsHref}
            className="flex items-center justify-between rounded-md px-3 py-2 font-medium hover:bg-accent"
          >
            Announcements
            {unreadAnnouncements > 0 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {unreadAnnouncements}
              </span>
            )}
          </Link>
          {profileHref && (
            <Link href={profileHref} className="rounded-md px-3 py-2 font-medium hover:bg-accent">
              Digital ID & Profile
            </Link>
          )}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          {email}
          <div className="mt-0.5">
            {role}
            {isLead ? " - Unit Lead" : ""}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b bg-card px-4 py-3">
          <div className="md:hidden">
            <Logo />
          </div>
          <GlobalSearch
            eventHref={(id) => (variant === "volunteer" ? `/events/${id}` : `/admin/events`)}
          />
          <span className="ml-auto whitespace-nowrap rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {getAcademicYear()}
          </span>
        </header>
        <div className="flex-1 bg-background">{children}</div>
      </div>
    </div>
  );
}
