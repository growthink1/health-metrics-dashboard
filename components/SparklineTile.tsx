"use client";

import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar } from "recharts";
import type { GridTile } from "@/lib/types";

const COLORS: Record<GridTile["metric"], string> = {
  hrv: "var(--accent-primary)",
  rhr: "var(--accent-warm)",
  sleep_min: "var(--accent-good)",
  strain: "var(--accent-strain)",
  recovery: "var(--accent-good)",
  weight_lbs: "var(--text-muted)",
};

const LABELS: Record<GridTile["metric"], string> = {
  hrv: "HRV",
  rhr: "RHR",
  sleep_min: "Sleep",
  strain: "Strain",
  recovery: "Recovery",
  weight_lbs: "Weight",
};

function formatCurrent(metric: GridTile["metric"], v: number | null): string {
  if (v === null) return "—";
  if (metric === "sleep_min") return `${(v / 60).toFixed(1)}h`;
  if (metric === "weight_lbs") return v.toFixed(1);
  if (metric === "strain") return v.toFixed(1);
  return Math.round(v).toString();
}

export function SparklineTile({ tile }: { tile: GridTile }) {
  const color = COLORS[tile.metric];
  const label = LABELS[tile.metric];
  const data = tile.series.map((p) => ({ ...p, value: p.value ?? 0 }));
  const isStrain = tile.metric === "strain";

  return (
    <Link
      href={`/metric/${tile.metric}`}
      className="block border border-border rounded p-4 bg-surface hover:border-accent-primary transition"
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
        <div className="font-mono text-xl">{formatCurrent(tile.metric, tile.current)}</div>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          {isStrain ? (
            <BarChart data={data}>
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Link>
  );
}
