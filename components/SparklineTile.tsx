"use client";

import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar } from "recharts";
import type { GridTile } from "@/lib/types";

const COLORS: Record<GridTile["metric"], string> = {
  hrv: "var(--accent-primary)",
  rhr: "var(--accent-warm)",
  sleep_min: "var(--accent-good)",
  strain: "var(--accent-strain)",
  recovery: "var(--accent-bad)",
  weight_lbs: "var(--accent-weight)",
};

const LABELS: Record<GridTile["metric"], string> = {
  hrv: "HRV",
  rhr: "RHR",
  sleep_min: "SLEEP",
  strain: "STRAIN",
  recovery: "RECOVERY",
  weight_lbs: "WEIGHT",
};

const UNITS: Partial<Record<GridTile["metric"], string>> = {
  hrv: "ms",
  rhr: "bpm",
  sleep_min: "h",
  weight_lbs: "lb",
};

function formatCurrent(metric: GridTile["metric"], v: number | null): string {
  if (v === null) return "—";
  if (metric === "sleep_min") return `${(v / 60).toFixed(1)}`;
  if (metric === "weight_lbs") return v.toFixed(1);
  if (metric === "strain") return v.toFixed(1);
  return Math.round(v).toString();
}

function deltaLabel(tile: GridTile): string {
  // "−7d" / "TODAY" pattern from the design, but only when we have data
  if (tile.series.length < 2) return "";
  const first = tile.series[0].value;
  const last = tile.series[tile.series.length - 1].value;
  if (first === null || last === null) return "";
  const diff = last - first;
  if (tile.metric === "sleep_min") {
    return `${diff >= 0 ? "+" : ""}${(diff / 60).toFixed(1)}h / ${tile.series.length}d`;
  }
  if (tile.metric === "weight_lbs") {
    return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}lb / ${tile.series.length}d`;
  }
  return `${diff >= 0 ? "+" : ""}${Math.round(diff)} / ${tile.series.length}d`;
}

export function SparklineTile({ tile }: { tile: GridTile }) {
  const color = COLORS[tile.metric];
  const label = LABELS[tile.metric];
  const unit = UNITS[tile.metric];
  const data = tile.series.map((p) => ({ ...p, value: p.value ?? 0 }));
  const isStrain = tile.metric === "strain";

  return (
    <Link
      href={`/metric/${tile.metric}`}
      className="block rounded-md hairline overflow-hidden group transition hover:-translate-y-px"
      style={{ background: "var(--surface)" }}
    >
      <div className="h-[3px] w-full" style={{ background: color }} />
      <div className="p-3.5">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-[10px] tracked text-muted">{label}</div>
          <div className="font-mono text-[10px] text-muted-2">{deltaLabel(tile)}</div>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <div className="text-[28px] font-bold leading-none tnum" style={{ color }}>
            {formatCurrent(tile.metric, tile.current)}
          </div>
          {unit ? <div className="font-mono text-[11px] text-muted">{unit}</div> : null}
        </div>
        <div className="mt-2 h-[44px]">
          <ResponsiveContainer width="100%" height="100%">
            {isStrain ? (
              <BarChart data={data}>
                <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-2">
          <span>−{tile.series.length}d</span>
          <span>TODAY</span>
        </div>
      </div>
    </Link>
  );
}
