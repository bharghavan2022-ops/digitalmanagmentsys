import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Coordinators and auditors share this portal; the UI hides mutating
// controls for auditors, but every mutating route also rejects them
// server-side (see requireRole calls in src/app/api/**).
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "COORDINATOR" && user.role !== "AUDITOR") redirect("/dashboard");

  return <div className="flex flex-1 flex-col">{children}</div>;
}
