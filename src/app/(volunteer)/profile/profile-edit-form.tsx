"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = {
  phone: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hostelRoom: string;
  languages: string;
  skills: string;
};

const FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "bloodGroup", label: "Blood group" },
  { key: "emergencyContactName", label: "Emergency contact name" },
  { key: "emergencyContactPhone", label: "Emergency contact phone" },
  { key: "hostelRoom", label: "Hostel / room" },
  { key: "languages", label: "Languages spoken" },
  { key: "skills", label: "Certified skills" },
];

export function ProfileEditForm({ initial }: { initial: FormState }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex flex-col gap-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="col-span-2 grid grid-cols-[auto_1fr] gap-x-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{initial[key] || "-"}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setEditing(true)}>
          Edit details
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/volunteers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not save changes");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            value={form[key]}
            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
