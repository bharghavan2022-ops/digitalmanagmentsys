import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { CreateEventForm } from "./create-event-form";

export default async function CreateEventPage() {
  const user = await getCurrentUser();
  // Server-side belt-and-braces: an AUDITOR must never reach a mutating
  // page, even if they guess the URL directly.
  if (user?.role !== "COORDINATOR") redirect("/admin/events");

  return (
    <main className="mx-auto w-full max-w-lg p-8">
      <h1 className="mb-4 text-2xl font-semibold">Create event</h1>
      <CreateEventForm />
    </main>
  );
}
