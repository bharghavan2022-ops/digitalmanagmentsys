import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Single redirect target after sign-in: routes each role to its own portal
// so /login doesn't need to know the URL layout of either one.
export default async function PostLoginPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "VOLUNTEER" ? "/dashboard" : "/admin/dashboard");
}
