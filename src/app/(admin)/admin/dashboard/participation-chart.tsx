"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyParticipationPoint } from "@/lib/participation";

export function ParticipationChart({ data }: { data: MonthlyParticipationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" fontSize={12} tickLine={false} />
        <YAxis allowDecimals={false} fontSize={12} tickLine={false} width={28} />
        <Tooltip />
        <Bar dataKey="count" name="Verified check-ins" fill="hsl(var(--secondary))" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  );
}
