import { TodayStrip } from "@/components/TodayStrip";
import { NarrationLine } from "@/components/NarrationLine";
import { LogPanel } from "@/components/LogPanel";
import { SparklineTile } from "@/components/SparklineTile";
import { WindowSelector } from "@/components/WindowSelector";
import { fetchDashboardToday, fetchDashboardGrid } from "@/lib/api";

export const dynamic = "force-dynamic";

interface PageProps { searchParams: Promise<{ days?: string }> }

export default async function GridPage({ searchParams }: PageProps) {
  const { days: daysParam } = await searchParams;
  const days = Number(daysParam ?? 14);
  const [today, grid] = await Promise.all([
    fetchDashboardToday(),
    fetchDashboardGrid("hugo", days),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <TodayStrip data={today.today_strip} metricDate={today.metric_date} />
      <NarrationLine narration={today.narration} />
      <LogPanel logDate={today.metric_date} logStatus={today.today_strip.log_status} />

      <div className="flex items-center justify-between">
        <div className="text-xs text-text-muted font-mono">Window:</div>
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
