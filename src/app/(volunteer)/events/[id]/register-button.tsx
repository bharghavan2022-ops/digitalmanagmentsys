"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegisterButton({
  eventId,
  alreadyRegistered,
  waitlisted,
  isFull,
  canCancel,
}: {
  eventId: string;
  alreadyRegistered: boolean;
  waitlisted: boolean;
  isFull: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCancel() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/events/${eventId}/register`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not cancel registration");
      return;
    }
    router.refresh();
  }

  if (alreadyRegistered) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {waitlisted ? "You are on the waitlist for this event." : "You are registered for this event."}
        </p>
        {canCancel && (
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            {loading ? "Cancelling..." : "Cancel registration"}
          </Button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
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
