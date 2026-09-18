"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateCertificateForm({
  volunteers,
}: {
  volunteers: { id: string; fullName: string; nssId: string }[];
}) {
  const router = useRouter();
  const [volunteerId, setVolunteerId] = useState(volunteers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!volunteerId) return;
    setLoading(true);
    setError(null);

    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteerId }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not generate certificate");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <select
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        value={volunteerId}
        onChange={(e) => setVolunteerId(e.target.value)}
      >
        {volunteers.map((v) => (
          <option key={v.id} value={v.id}>
            {v.fullName} ({v.nssId})
          </option>
        ))}
      </select>
      <Button type="submit" disabled={loading || !volunteerId}>
        {loading ? "Generating..." : "Generate certificate"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
