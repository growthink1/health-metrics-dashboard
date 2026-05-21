import type { Goal, Trajectory } from "@/lib/types";

function colorForPace(p: number | null): string {
  if (p === null) return "var(--muted)";
  if (p >= 0.65) return "var(--accent-good)";
  if (p >= 0.35) return "var(--accent-warm)";
  return "var(--accent-bad)";
}

export function GoalStatRow({ goal, trajectory }: { goal: Goal; trajectory: Trajectory | null }) {
  const p = trajectory?.p_on_pace ?? null;
  const cv = trajectory?.current_value;
  const tv = goal.target_value;
  const sv = goal.start_value ?? cv ?? tv;
  const total = Math.abs(tv - sv) || 1;
  const done = cv != null ? Math.abs(cv - sv) : 0;
  const pct = Math.max(0, Math.min(100, (done / total) * 100));
  const today = new Date();
  const deadline = new Date(goal.target_date);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));
  const proj = trajectory?.projected_value_mean;
  const pPct = p == null ? null : Math.round(p * 100);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-md hairline p-3" style={{ background: "var(--surface)" }}>
        <div className="font-mono text-[10px] text-muted tracked uppercase">Progress</div>
        <div className="text-2xl font-semibold tnum" style={{ color: colorForPace(p) }}>
          {pct.toFixed(0)}%
        </div>
        <div className="font-mono text-[10px] text-muted mt-1 tnum">
          {done.toFixed(1)} of {total.toFixed(1)}
        </div>
      </div>
      <div className="rounded-md hairline p-3" style={{ background: "var(--surface)" }}>
        <div className="font-mono text-[10px] text-muted tracked uppercase">Days left</div>
        <div className="text-2xl font-semibold tnum" style={{
          color: daysLeft < 7 && (p == null || p < 0.65) ? "var(--accent-bad)" : "var(--text)"
        }}>
          {daysLeft}
        </div>
        <div className="font-mono text-[10px] text-muted mt-1">deadline {goal.target_date}</div>
      </div>
      <div className="rounded-md hairline p-3" style={{ background: "var(--surface)" }}>
        <div className="font-mono text-[10px] text-muted tracked uppercase">Projection</div>
        <div className="text-2xl font-semibold tnum" style={{ color: colorForPace(p) }}>
          {proj != null ? proj.toFixed(1) : "—"}
        </div>
        <div className="font-mono text-[10px] text-muted mt-1">
          {pPct == null ? "no projection yet" : `${pPct}% chance of hitting target`}
        </div>
      </div>
    </div>
  );
}
