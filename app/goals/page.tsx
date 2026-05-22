import { fetchGoalStatus, fetchMetricDetail } from "@/lib/api";
import { GoalSetupPanel } from "@/components/GoalSetupPanel";
import { GoalHeader } from "@/components/GoalHeader";
import { GoalStatRow } from "@/components/GoalStatRow";
import { GoalTrajectoryChart } from "@/components/GoalTrajectoryChart";
import { MilestoneList } from "@/components/MilestoneList";
import { SubgoalList } from "@/components/SubgoalList";
import { RecommendationCard } from "@/components/RecommendationCard";

export const dynamic = "force-dynamic";

async function loadObserved(metric: string, days: number) {
  if (metric !== "weight_lbs") return [];
  try {
    const md = await fetchMetricDetail("weight_lbs", "hugo", days);
    return md.series
      .filter((p): p is { date: string; value: number } => p.value != null)
      .map((p) => ({ date: p.date, value: p.value }));
  } catch {
    return [];
  }
}

export default async function GoalsPage() {
  const status = await fetchGoalStatus("hugo");
  if (status.goal == null) {
    return (
      <main className="max-w-6xl mx-auto px-6">
        <GoalSetupPanel />
      </main>
    );
  }
  const goal = status.goal;
  const goalDirection: "down" | "up" =
    (goal.start_value ?? goal.target_value) > goal.target_value ? "down" : "up";
  const lookbackDays = Math.min(
    180,
    Math.max(30, Math.ceil((new Date(goal.target_date).getTime() - new Date(goal.start_date).getTime()) / 86400000)),
  );
  const observed = await loadObserved(goal.metric, lookbackDays);

  return (
    <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
      <GoalHeader goal={goal} />
      <GoalTrajectoryChart goal={goal} trajectory={status.trajectory} observed={observed} />
      <GoalStatRow goal={goal} trajectory={status.trajectory} />
      <div className="grid grid-cols-2 gap-4">
        <MilestoneList milestones={status.milestones} trajectory={status.trajectory} goalDirection={goalDirection} />
        <SubgoalList subgoals={status.subgoals} />
      </div>
      {status.recommendation && <RecommendationCard rec={status.recommendation} />}
    </main>
  );
}
