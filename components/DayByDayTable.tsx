import type { SeriesPoint } from "@/lib/types";
import { formatZ } from "@/lib/format";

export function DayByDayTable({ series }: { series: SeriesPoint[] }) {
  const sorted = [...series].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="border border-border rounded bg-surface overflow-hidden">
      <table className="w-full text-sm font-mono">
        <thead className="bg-bg/40 text-text-muted text-xs">
          <tr>
            <th className="text-left px-3 py-2">Date</th>
            <th className="text-right px-3 py-2">Value</th>
            <th className="text-right px-3 py-2">z</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.date} className="border-t border-border">
              <td className="px-3 py-2">{p.date}</td>
              <td className="px-3 py-2 text-right">{p.value ?? "—"}</td>
              <td className="px-3 py-2 text-right text-text-muted">{formatZ(p.z)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
