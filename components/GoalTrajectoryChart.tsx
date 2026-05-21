"use client";

import {
  ComposedChart, Line, Area, ReferenceLine, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Goal, Trajectory } from "@/lib/types";

interface ChartPoint {
  date: string;
  observed?: number;
  projected?: number;
  ci_low?: number;
  ci_high?: number;
}

export function GoalTrajectoryChart({
  goal, trajectory, observed,
}: {
  goal: Goal;
  trajectory: Trajectory | null;
  observed: { date: string; value: number }[];
}) {
  if (!trajectory || trajectory.method === "insufficient_data") {
    return (
      <div className="rounded-md hairline p-8 flex items-center justify-center"
           style={{ background: "var(--surface)", minHeight: 240 }}>
        <div className="text-center">
          <div className="text-muted font-mono text-[11px] uppercase tracked">
            Collecting baseline
          </div>
          <div className="text-sm mt-2" style={{ color: "var(--text)" }}>
            {trajectory ?
              `${trajectory.data_points_used} / ${trajectory.min_required ?? "?"} data points` :
              "no data yet"}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const data: ChartPoint[] = [
    ...observed.map((o) => ({ date: o.date, observed: o.value })),
    {
      date: goal.target_date,
      projected: trajectory.projected_value_mean ?? undefined,
      ci_low: trajectory.projected_value_ci_low ?? undefined,
      ci_high: trajectory.projected_value_ci_high ?? undefined,
    },
  ];
  // Bridge a "projection start" point at today using the current observed value
  if (trajectory.current_value != null) {
    data.push({
      date: today, projected: trajectory.current_value,
      ci_low: trajectory.current_value, ci_high: trajectory.current_value,
    });
  }
  data.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="rounded-md hairline" style={{ background: "var(--surface)", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", fontSize: 11 }}
            labelStyle={{ color: "var(--text)" }}
          />
          {/* 95% CI ribbon */}
          <Area type="monotone" dataKey="ci_high" stroke="none"
                fill="rgba(126,181,224,0.18)" connectNulls />
          <Area type="monotone" dataKey="ci_low" stroke="none"
                fill="var(--surface)" connectNulls />
          {/* Observed line */}
          <Line type="monotone" dataKey="observed" stroke="#7eb5e0" strokeWidth={2}
                dot={false} connectNulls={false} />
          {/* Projection line (dashed) */}
          <Line type="monotone" dataKey="projected" stroke="#d44a8a" strokeWidth={2}
                strokeDasharray="5 5" dot={false} connectNulls />
          {/* Target line */}
          <ReferenceLine y={goal.target_value} stroke="var(--accent-warm)"
                         strokeDasharray="3 3" label={{ value: "target", fontSize: 10, fill: "var(--accent-warm)" }} />
          {/* Today marker */}
          <ReferenceLine x={today} stroke="var(--muted)" strokeDasharray="2 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
