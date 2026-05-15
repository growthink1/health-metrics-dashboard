"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import type { SeriesPoint } from "@/lib/types";

interface Props {
  metric: string;
  series: SeriesPoint[];
  baseline: { mean: number; lower_1sd: number; upper_1sd: number };
}

export function MetricChart({ metric, series, baseline }: Props) {
  const data = series.map((p) => ({ ...p, value: p.value ?? 0 }));
  const xDomain: [string, string] | undefined =
    data.length > 0 ? [data[0].date, data[data.length - 1].date] : undefined;
  const isStrain = metric === "strain";
  const color = isStrain ? "var(--accent-strain)" : "var(--accent-primary)";

  return (
    <div className="h-72 border border-border rounded p-3 bg-surface">
      <ResponsiveContainer width="100%" height="100%">
        {isStrain ? (
          <BarChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: `1px solid var(--border)` }} />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
            {xDomain ? (
              <ReferenceArea
                y1={baseline.lower_1sd}
                y2={baseline.upper_1sd}
                fill="var(--accent-primary)"
                fillOpacity={0.08}
                ifOverflow="extendDomain"
              />
            ) : null}
            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: `1px solid var(--border)` }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
