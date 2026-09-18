"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  title: "",
  description: "",
  category: "",
  venueName: "",
  startTime: "",
  endTime: "",
  awardedHours: "1",
  maxCapacity: "",
};

export function CreateEventForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        venueName: form.venueName,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        awardedHours: Number(form.awardedHours),
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not create event");
      return;
    }

    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={form.title} onChange={update("title")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          required
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
          value={form.description}
          onChange={update("description")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Input id="category" required value={form.category} onChange={update("category")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venueName">Venue</Label>
        <Input id="venueName" required value={form.venueName} onChange={update("venueName")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startTime">Starts</Label>
          <Input
            id="startTime"
            type="datetime-local"
            required
            value={form.startTime}
            onChange={update("startTime")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endTime">Ends</Label>
          <Input
            id="endTime"
            type="datetime-local"
            required
            value={form.endTime}
            onChange={update("endTime")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="awardedHours">Hours awarded</Label>
          <Input
            id="awardedHours"
            type="number"
            min={0.5}
            step={0.5}
            required
            value={form.awardedHours}
            onChange={update("awardedHours")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxCapacity">Max capacity (optional)</Label>
          <Input
            id="maxCapacity"
            type="number"
            min={1}
            value={form.maxCapacity}
            onChange={update("maxCapacity")}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create event"}
      </Button>
    </form>
  );
}
