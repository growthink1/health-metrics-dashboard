import { TodayStrip } from "@/components/TodayStrip";
import { NarrationLine } from "@/components/NarrationLine";
import { fetchDashboardToday } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function GridPage() {
  const today = await fetchDashboardToday();
  return (
    <div className="space-y-6 max-w-5xl">
      <TodayStrip data={today.today_strip} metricDate={today.metric_date} />
      <NarrationLine narration={today.narration} />
      <div className="border border-border rounded p-6 bg-surface text-text-muted">
        Grid tiles — wired in Task 6
      </div>
    </div>
  );
}
