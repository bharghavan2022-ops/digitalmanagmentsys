import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function VolunteerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "VOLUNTEER") redirect("/admin/dashboard");

  return <div className="flex flex-1 flex-col">{children}</div>;
}
