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

const METRIC_COLOR: Record<string, string> = {
  hrv: "var(--accent-primary)",
  rhr: "var(--accent-warm)",
  sleep_min: "var(--accent-good)",
  strain: "var(--accent-strain)",
  recovery: "var(--accent-bad)",
  weight_lbs: "var(--accent-weight)",
};

export function MetricChart({ metric, series, baseline }: Props) {
  const data = series.map((p) => ({ ...p, value: p.value ?? 0 }));
  const xDomain: [string, string] | undefined =
    data.length > 0 ? [data[0].date, data[data.length - 1].date] : undefined;
  const isStrain = metric === "strain";
  const color = METRIC_COLOR[metric] ?? "var(--accent-primary)";

  return (
    <div
      className="h-72 rounded-md hairline p-3"
      style={{ background: "var(--surface)" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {isStrain ? (
          <BarChart data={data}>
            <CartesianGrid stroke="var(--border-soft)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 6,
                color: "var(--text)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--muted)", fontFamily: "var(--font-mono), monospace" }}
            />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border-soft)" strokeOpacity={0.6} vertical={false} />
            {xDomain ? (
              <ReferenceArea
                y1={baseline.lower_1sd}
                y2={baseline.upper_1sd}
                fill={color}
                fillOpacity={0.06}
                ifOverflow="extendDomain"
              />
            ) : null}
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), JetBrains Mono, monospace" }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: 6,
                color: "var(--text)",
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--muted)", fontFamily: "var(--font-mono), monospace" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, stroke: "var(--bg)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
