"use client";

import React, { useState } from "react";
import type { Workout, WorkoutSet } from "@/lib/types";
import { fetchWorkoutSets } from "@/lib/api";

export function WorkoutTable({ workouts }: { workouts: Workout[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [setsByWorkout, setSetsByWorkout] = useState<Record<number, WorkoutSet[] | "loading">>({});

  if (workouts.length === 0) {
    return (
      <div
        className="rounded-md hairline p-6 text-muted text-sm font-mono"
        style={{ background: "var(--surface)" }}
      >
        NO WORKOUTS IN THIS WINDOW.
      </div>
    );
  }

  async function toggle(w: Workout) {
    const id = w.id;
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
      setExpanded(next);
      return;
    }
    next.add(id);
    setExpanded(next);
    if (!(id in setsByWorkout)) {
      setSetsByWorkout((prev) => ({ ...prev, [id]: "loading" }));
      try {
        const resp = await fetchWorkoutSets(id);
        setSetsByWorkout((prev) => ({ ...prev, [id]: resp.sets }));
      } catch {
        setSetsByWorkout((prev) => ({ ...prev, [id]: [] }));
      }
    }
  }

  return (
    <div className="rounded-md hairline overflow-hidden" style={{ background: "var(--surface)" }}>
      <table className="w-full text-sm font-mono">
        <thead style={{ background: "var(--surface-2)" }}>
          <tr className="text-muted text-[10px] tracked">
            <th className="w-8"></th>
            <th className="text-left px-3 py-2 font-medium">DATE</th>
            <th className="text-left px-3 py-2 font-medium">TYPE</th>
            <th className="text-right px-3 py-2 font-medium">DURATION</th>
            <th className="text-right px-3 py-2 font-medium">STRAIN</th>
            <th className="text-right px-3 py-2 font-medium">KCAL</th>
            <th className="text-right px-3 py-2 font-medium">AVG HR</th>
            <th className="text-right px-3 py-2 font-medium">MAX HR</th>
          </tr>
        </thead>
        <tbody>
          {workouts.map((w) => {
            const id = w.id;
            const isExpanded = expanded.has(id);
            const sets = setsByWorkout[id];
            return (
              <React.Fragment key={`${w.source}-${w.source_id}`}>
                <tr
                  className="border-t hover:bg-white/[0.03] transition"
                  style={{ borderColor: "var(--border-soft)" }}
                >
                  <td className="px-2 py-2">
                    <button
                      aria-label={isExpanded ? "Collapse row" : "Expand row"}
                      onClick={() => toggle(w)}
                      className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-muted"
                    >
                      <svg width="10" height="10" viewBox="0 0 16 16" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                        <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-muted">{w.date}</td>
                  <td className="px-3 py-2" style={{ color: "var(--text)" }}>{w.type ?? "—"}</td>
                  <td className="px-3 py-2 text-right tnum">{w.duration_min}m</td>
                  <td className="px-3 py-2 text-right tnum font-semibold" style={{ color: "var(--accent-strain)" }}>
                    {w.strain?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tnum">{w.kcal ?? "—"}</td>
                  <td className="px-3 py-2 text-right tnum text-muted">{w.avg_hr ?? "—"}</td>
                  <td className="px-3 py-2 text-right tnum text-muted">{w.max_hr ?? "—"}</td>
                </tr>
                {isExpanded ? (
                  <tr style={{ background: "var(--surface-2)" }}>
                    <td colSpan={8} className="px-8 py-3">
                      {sets === "loading" ? (
                        <div className="text-[11px] text-muted font-mono">Loading sets…</div>
                      ) : !sets || sets.length === 0 ? (
                        <div className="text-[11px] text-muted font-mono italic">no sets logged</div>
                      ) : (
                        <table className="w-full text-[11px] font-mono">
                          <thead className="text-muted-2">
                            <tr>
                              <th className="text-left py-1">#</th>
                              <th className="text-left py-1">EXERCISE</th>
                              <th className="text-right py-1">REPS</th>
                              <th className="text-right py-1">WEIGHT</th>
                              <th className="text-right py-1">RPE</th>
                              <th className="text-left py-1 pl-3">NOTES</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sets.map((s) => (
                              <tr key={s.id} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                                <td className="py-1 text-muted">{s.set_number}</td>
                                <td className="py-1">{s.exercise}</td>
                                <td className="py-1 text-right tnum">{s.reps}</td>
                                <td className="py-1 text-right tnum">{s.weight_lbs ?? "—"}</td>
                                <td className="py-1 text-right tnum">{s.rpe ?? "—"}</td>
                                <td className="py-1 pl-3 text-muted">{s.notes ?? ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
