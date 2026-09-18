"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateAnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, audience: audience || undefined }),
    });

    setLoading(false);
    if (!response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      setError(responseBody.error ?? "Could not post announcement");
      return;
    }

    setTitle("");
    setBody("");
    setAudience("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Message</Label>
        <textarea
          id="body"
          required
          className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audience">Audience</Label>
        <select
          id="audience"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        >
          <option value="">Everyone</option>
          <option value="VOLUNTEER">Volunteers</option>
          <option value="COORDINATOR">Coordinators</option>
          <option value="AUDITOR">Auditors</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? "Posting..." : "Post announcement"}
      </Button>
    </form>
  );
}
