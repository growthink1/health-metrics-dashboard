import { fetchWorkouts } from "@/lib/api";
import { WorkoutTable } from "@/components/WorkoutTable";
import { WindowSelector } from "@/components/WindowSelector";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ days?: string; type?: string }>;
}

export default async function WorkoutsPage({ searchParams }: PageProps) {
  const { days: daysParam, type } = await searchParams;
  const days = Number(daysParam ?? 30);
  const { workouts } = await fetchWorkouts("hugo", days, type);

  const totalStrain = workouts.reduce((s, w) => s + (w.strain ?? 0), 0);
  const totalKcal = workouts.reduce((s, w) => s + (w.kcal ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl uppercase">Workouts</h1>
        <WindowSelector defaultDays={days} />
      </div>
      <div className="flex gap-3 text-sm font-mono text-text-muted">
        <span>Total strain: {totalStrain.toFixed(1)}</span>
        <span>·</span>
        <span>Total kcal: {totalKcal.toLocaleString()}</span>
        <span>·</span>
        <span>Sessions: {workouts.length}</span>
      </div>
      <WorkoutTable workouts={workouts} />
    </div>
  );
}
