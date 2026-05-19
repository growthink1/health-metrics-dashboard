import { HeroBlock } from "@/components/HeroBlock";
import { MetricChip } from "@/components/MetricChip";
import { NarrationLine } from "@/components/NarrationLine";
import { LogPanel } from "@/components/LogPanel";
import { SparklineTile } from "@/components/SparklineTile";
import { WindowSelector } from "@/components/WindowSelector";
import { fetchDashboardToday, fetchDashboardGrid } from "@/lib/api";
import { formatHours, formatZ } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function GridPage({ searchParams }: PageProps) {
  const { days: daysParam } = await searchParams;
  const days = Number(daysParam ?? 14);
  const [today, grid] = await Promise.all([
    fetchDashboardToday(),
    fetchDashboardGrid("hugo", days),
  ]);

  const recoveryTile = grid.tiles.find((t) => t.metric === "recovery");
  const recoveryScore =
    recoveryTile?.current !== undefined && recoveryTile.current !== null
      ? Math.round(recoveryTile.current)
      : null;

  const hrv = grid.tiles.find((t) => t.metric === "hrv");
  const rhr = grid.tiles.find((t) => t.metric === "rhr");
  const sleepMin = grid.tiles.find((t) => t.metric === "sleep_min");
  const strain = grid.tiles.find((t) => t.metric === "strain");

  const fmtNum = (v: number | null | undefined, digits = 0): string =>
    v === null || v === undefined ? "—" : v.toFixed(digits);

  return (
    <div className="space-y-4 max-w-5xl">
      <HeroBlock
        data={today.today_strip}
        metricDate={today.metric_date}
        recoveryScore={recoveryScore}
      />

      <div className="flex flex-wrap gap-2">
        <MetricChip label="HRV" value={fmtNum(hrv?.current, 0)} unit="ms" color="primary"
          sub={formatZ(today.today_strip.hrv_z_3d_avg) || undefined} />
        <MetricChip label="RHR" value={fmtNum(rhr?.current, 0)} unit="bpm" color="warm" />
        <MetricChip
          label="SLEEP"
          value={sleepMin?.current ? formatHours(sleepMin.current) : "—"}
          color="good"
        />
        <MetricChip label="STRAIN" value={fmtNum(strain?.current, 1)} color="strain" />
      </div>

      <NarrationLine narration={today.narration} />
      <LogPanel logDate={today.metric_date} logStatus={today.today_strip.log_status} />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted font-mono">Window:</div>
        <WindowSelector defaultDays={days} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grid.tiles.map((tile) => (
          <SparklineTile key={tile.metric} tile={tile} />
        ))}
      </div>
    </div>
  );
}
