"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FeedbackForm({
  eventId,
  existingRating,
  existingMessage,
}: {
  eventId: string;
  existingRating: number | null;
  existingMessage: string | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existingRating ?? 5);
  const [message, setMessage] = useState(existingMessage ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(existingRating !== null);

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Thanks for your feedback.</p>;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, rating, message: message || undefined }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not submit feedback");
      return;
    }
    setSubmitted(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        Rating
        <select
          className="h-9 w-24 rounded-md border border-input bg-transparent px-3 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <textarea
        className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        placeholder="Optional comments"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? "Submitting..." : "Submit feedback"}
      </Button>
    </form>
  );
}
