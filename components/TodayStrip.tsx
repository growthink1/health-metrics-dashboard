import type { TodayStripData } from "@/lib/types";
import { formatZ, recommendationLabel } from "@/lib/format";

interface Props {
  data: TodayStripData;
  metricDate: string;
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 border border-border rounded bg-surface min-w-[140px]">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="font-mono text-2xl">{value}</div>
      {sub ? <div className="text-xs text-text-muted">{sub}</div> : null}
    </div>
  );
}

export function TodayStrip({ data, metricDate }: Props) {
  const recommendation = recommendationLabel(data.recommendation);
  const kcal = data.suggested_kcal !== null ? data.suggested_kcal.toLocaleString() : "—";
  const hrv = data.today_hrv_ms !== null ? `${data.today_hrv_ms}` : "—";
  const z = formatZ(data.hrv_z_3d_avg);

  const logStatus = data.log_status === "complete"
    ? "complete"
    : data.log_status === "all_missing"
      ? "all ⚠"
      : data.log_status.split(",").map(t => t.replace("_missing", "⚠")).join(" ");

  return (
    <div className="space-y-2">
      <div className="text-xs text-text-muted font-mono">Metric date: {metricDate}</div>
      <div className="flex gap-3">
        <Cell label="Recommend" value={recommendation} sub={data.suggested_training_mod ?? undefined} />
        <Cell label="kcal" value={kcal} />
        <Cell label="HRV (today)" value={hrv} sub={z || undefined} />
        <Cell label="Log" value={logStatus} />
      </div>
    </div>
  );
}
