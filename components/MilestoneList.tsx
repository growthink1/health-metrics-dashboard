import type { Milestone, Trajectory } from "@/lib/types";

export function MilestoneList({
  milestones, trajectory, goalDirection,
}: {
  milestones: Milestone[];
  trajectory: Trajectory | null;
  goalDirection: "down" | "up";  // "down" for weight loss, "up" for strength
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="rounded-md hairline" style={{ background: "var(--surface)" }}>
      <div className="px-3 py-2 font-mono text-[10px] tracked text-muted uppercase border-b"
           style={{ borderColor: "var(--border-soft)" }}>
        Milestones
      </div>
      <ul>
        {milestones.map((m, i) => {
          const past = m.target_date < today;
          const hit = m.hit_at != null;
          const projAt = trajectory?.projected_value_mean ?? null;
          const onPace =
            projAt == null ? null :
              goalDirection === "down" ? projAt <= m.target_value : projAt >= m.target_value;
          const badge = hit
            ? { text: `hit ${m.hit_at!.slice(0, 10)}`, color: "var(--accent-good)" }
            : past
              ? { text: "missed", color: "var(--accent-bad)" }
              : onPace == null
                ? { text: "—", color: "var(--muted)" }
                : onPace
                  ? { text: "on pace", color: "var(--accent-good)" }
                  : { text: "behind", color: "var(--accent-warm)" };
          return (
            <li key={i} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                style={{ borderColor: "var(--border-soft)" }}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[13px] tnum" style={{ color: "var(--text)" }}>
                  {m.target_value}
                </span>
                <span className="font-mono text-[10px] text-muted">{m.target_date}</span>
              </div>
              <span className="font-mono text-[10px]" style={{ color: badge.color }}>{badge.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
