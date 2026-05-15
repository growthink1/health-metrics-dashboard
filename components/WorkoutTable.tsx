import type { Workout } from "@/lib/types";

export function WorkoutTable({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) {
    return (
      <div className="border border-border rounded p-6 bg-surface text-text-muted text-sm">
        No workouts in this window.
      </div>
    );
  }
  return (
    <div className="border border-border rounded bg-surface overflow-hidden">
      <table className="w-full text-sm font-mono">
        <thead className="bg-bg/40 text-text-muted text-xs">
          <tr>
            <th className="text-left px-3 py-2">Date</th>
            <th className="text-left px-3 py-2">Type</th>
            <th className="text-right px-3 py-2">Duration</th>
            <th className="text-right px-3 py-2">Strain</th>
            <th className="text-right px-3 py-2">Kcal</th>
            <th className="text-right px-3 py-2">Avg HR</th>
            <th className="text-right px-3 py-2">Max HR</th>
          </tr>
        </thead>
        <tbody>
          {workouts.map((w) => (
            <tr key={`${w.source}-${w.source_id}`} className="border-t border-border">
              <td className="px-3 py-2">{w.date}</td>
              <td className="px-3 py-2">{w.type ?? "—"}</td>
              <td className="px-3 py-2 text-right">{w.duration_min}m</td>
              <td className="px-3 py-2 text-right">{w.strain?.toFixed(1) ?? "—"}</td>
              <td className="px-3 py-2 text-right">{w.kcal ?? "—"}</td>
              <td className="px-3 py-2 text-right">{w.avg_hr ?? "—"}</td>
              <td className="px-3 py-2 text-right">{w.max_hr ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
