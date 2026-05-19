import type { Workout } from "@/lib/types";

export function WorkoutTable({ workouts }: { workouts: Workout[] }) {
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
  return (
    <div className="rounded-md hairline overflow-hidden" style={{ background: "var(--surface)" }}>
      <table className="w-full text-sm font-mono">
        <thead style={{ background: "var(--surface-2)" }}>
          <tr className="text-muted text-[10px] tracked">
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
          {workouts.map((w) => (
            <tr
              key={`${w.source}-${w.source_id}`}
              className="border-t hover:bg-white/[0.03] transition"
              style={{ borderColor: "var(--border-soft)" }}
            >
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
