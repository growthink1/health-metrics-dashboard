import type { Goal } from "@/lib/types";

export function GoalHeader({ goal }: { goal: Goal }) {
  return (
    <div className="rounded-md hairline px-4 py-3" style={{ background: "var(--surface)" }}>
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{goal.name}</h2>
        <span className="font-mono text-[10px] tracked text-muted">{goal.goal_type.toUpperCase()}</span>
      </div>
      <div className="font-mono text-[11px] text-muted mt-1">
        {goal.start_value ?? "?"} → {goal.target_value} · by {goal.target_date}
      </div>
    </div>
  );
}
