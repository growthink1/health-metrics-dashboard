"use client";

import { useState } from "react";
import type { Subgoal } from "@/lib/types";

function complianceColor(pct: number): string {
  if (pct >= 80) return "var(--accent-good)";
  if (pct >= 60) return "var(--accent-warm)";
  return "var(--accent-bad)";
}

function presetLabel(p: string): string {
  return p.replace(/_/g, " ");
}

export function SubgoalList({ subgoals }: { subgoals: Subgoal[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="rounded-md hairline" style={{ background: "var(--surface)" }}>
      <div className="px-3 py-2 font-mono text-[10px] tracked text-muted uppercase border-b"
           style={{ borderColor: "var(--border-soft)" }}>
        Subgoals
      </div>
      <ul>
        {subgoals.map((sg, i) => {
          const open = openIdx === i;
          return (
            <li key={i} className="border-b last:border-b-0" style={{ borderColor: "var(--border-soft)" }}>
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                aria-label={`Toggle ${sg.preset} drawer`}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[13px]" style={{ color: "var(--text)" }}>
                    {presetLabel(sg.preset)}
                  </span>
                  <span className="font-mono text-[10px] text-muted">target {sg.target_value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-soft)" }}>
                    <div className="h-full" style={{
                      width: `${Math.max(2, sg.compliance_pct)}%`,
                      background: complianceColor(sg.compliance_pct),
                    }} />
                  </div>
                  <span className="font-mono text-[10px] tnum" style={{ color: complianceColor(sg.compliance_pct) }}>
                    {Math.round(sg.compliance_pct)}%
                  </span>
                </div>
              </button>
              {open && (
                <div className="px-4 py-3 font-mono text-[11px]"
                     style={{ background: "var(--surface-2)", color: "var(--text)" }}>
                  <div className="text-muted mb-1">Why am I at {Math.round(sg.compliance_pct)}%?</div>
                  <div className="leading-relaxed">
                    Current {sg.current_value == null ? "—" : sg.current_value.toFixed(0)} vs target {sg.target_value}
                    {" "}(rolling {sg.window_days}-day window).
                    {sg.preset === "workouts_per_week" || sg.preset === "meal_logs_per_week"
                      ? ` Compliance = min(current / target, 1) × 100.`
                      : ` Compliance = 100 − |current − target| / target × 100.`}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
