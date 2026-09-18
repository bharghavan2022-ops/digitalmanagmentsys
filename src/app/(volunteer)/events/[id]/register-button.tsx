"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegisterButton({
  eventId,
  alreadyRegistered,
  waitlisted,
  isFull,
}: {
  eventId: string;
  alreadyRegistered: boolean;
  waitlisted: boolean;
  isFull: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyRegistered) {
    return (
      <p className="text-sm text-muted-foreground">
        {waitlisted ? "You are on the waitlist for this event." : "You are registered for this event."}
      </p>
    );
  }

  async function handleRegister() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Registration failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleRegister} disabled={loading} className="w-fit">
        {loading ? "Registering..." : isFull ? "Join waitlist" : "Register"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
