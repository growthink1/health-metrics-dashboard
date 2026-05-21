import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GoalTrajectoryChart } from "@/components/GoalTrajectoryChart";
import type { Goal, Trajectory } from "@/lib/types";

// recharts SVG rendering is unreliable in JSDOM — mock ResponsiveContainer to render children directly
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="rc">{children}</div>,
  };
});

const goal: Goal = {
  id: 1, name: "Lose 15 lbs", goal_type: "weight", metric: "weight_lbs",
  metric_params: null, start_value: 200, target_value: 185,
  start_date: "2026-05-01", target_date: "2026-08-01", status: "active",
};

describe("GoalTrajectoryChart", () => {
  it("renders insufficient-data placeholder", () => {
    const traj: Trajectory = {
      method: "insufficient_data", current_value: null,
      projected_value_mean: null, projected_value_ci_low: null, projected_value_ci_high: null,
      p_on_pace: null, confidence: "low", data_points_used: 3, min_required: 7,
    };
    render(<GoalTrajectoryChart goal={goal} trajectory={traj} observed={[]} />);
    expect(screen.getByText(/Collecting baseline/i)).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 7 data points/)).toBeInTheDocument();
  });

  it("renders the chart shell when projection present", () => {
    const traj: Trajectory = {
      method: "bayesian_normal_normal", current_value: 192.7,
      projected_value_mean: 187.2, projected_value_ci_low: 184, projected_value_ci_high: 190,
      p_on_pace: 0.34, confidence: "med", data_points_used: 28,
    };
    render(<GoalTrajectoryChart goal={goal} trajectory={traj} observed={[
      { date: "2026-05-01", value: 200 }, { date: "2026-05-20", value: 192.7 },
    ]} />);
    expect(screen.getByTestId("rc")).toBeInTheDocument();
  });
});
