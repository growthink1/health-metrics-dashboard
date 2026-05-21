import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GoalStatRow } from "@/components/GoalStatRow";
import type { Goal, Trajectory } from "@/lib/types";

const goal: Goal = {
  id: 1, name: "Lose 15 lbs", goal_type: "weight", metric: "weight_lbs",
  metric_params: null, start_value: 200, target_value: 185,
  start_date: "2026-05-01", target_date: "2026-08-01", status: "active",
};

function mkTraj(p: number | null, mean: number | null): Trajectory {
  return { method: "bayesian_normal_normal", current_value: 192.7,
    projected_value_mean: mean, projected_value_ci_low: 184, projected_value_ci_high: 190,
    p_on_pace: p, confidence: "med", data_points_used: 20 };
}

describe("GoalStatRow", () => {
  it("renders projection mean + p_on_pace percent", () => {
    render(<GoalStatRow goal={goal} trajectory={mkTraj(0.34, 188)} />);
    expect(screen.getByText("188.0")).toBeInTheDocument();
    expect(screen.getByText(/34% chance of hitting target/)).toBeInTheDocument();
  });

  it("shows em-dash when projection unavailable", () => {
    render(<GoalStatRow goal={goal} trajectory={mkTraj(null, null)} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("no projection yet")).toBeInTheDocument();
  });
});
