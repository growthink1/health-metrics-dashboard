import Link from "next/link";
import { fetchMetricDetail } from "@/lib/api";
import { MetricChart } from "@/components/MetricChart";
import { DayByDayTable } from "@/components/DayByDayTable";
import { WindowSelector } from "@/components/WindowSelector";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ days?: string }>;
}

export default async function MetricPage({ params, searchParams }: PageProps) {
  const { name } = await params;
  const { days: daysParam } = await searchParams;
  const days = Number(daysParam ?? 14);
  const detail = await fetchMetricDetail(name, "hugo", days);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-text-muted text-sm hover:text-text">← Back to grid</Link>
        <WindowSelector defaultDays={days} />
      </div>
      <h1 className="font-mono text-2xl uppercase">{detail.metric}</h1>
      <MetricChart metric={detail.metric} series={detail.series} baseline={detail.baseline} />
      <div className="text-sm font-mono text-text-muted">
        μ {detail.stats.mean.toFixed(1)} · σ {detail.stats.std.toFixed(2)} ·
        slope {detail.stats.slope_per_day.toFixed(3)}/day ·
        z (today) {detail.stats.z_today !== null ? detail.stats.z_today.toFixed(2) : "—"}
      </div>
      <DayByDayTable series={detail.series} />
    </div>
  );
}
