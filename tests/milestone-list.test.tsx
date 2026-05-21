import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MilestoneList } from "@/components/MilestoneList";
import type { Milestone, Trajectory } from "@/lib/types";

const traj: Trajectory = {
  method: "bayesian_normal_normal", current_value: 192,
  projected_value_mean: 187, projected_value_ci_low: 184, projected_value_ci_high: 190,
  p_on_pace: 0.34, confidence: "med", data_points_used: 20,
};

describe("MilestoneList", () => {
  it("renders hit badge when hit_at is set", () => {
    const ms: Milestone[] = [{ target_value: 195, target_date: "2026-06-15", hit_at: "2026-06-12T00:00:00Z", hit_value: 194.8 }];
    render(<MilestoneList milestones={ms} trajectory={traj} goalDirection="down" />);
    expect(screen.getByText(/hit 2026-06-12/)).toBeInTheDocument();
  });

  it("renders missed badge when past date and not hit", () => {
    const ms: Milestone[] = [{ target_value: 195, target_date: "2020-01-01", hit_at: null, hit_value: null }];
    render(<MilestoneList milestones={ms} trajectory={traj} goalDirection="down" />);
    expect(screen.getByText("missed")).toBeInTheDocument();
  });

  it("renders 'behind' when projection won't hit milestone (down direction)", () => {
    const ms: Milestone[] = [{ target_value: 185, target_date: "2099-01-01", hit_at: null, hit_value: null }];
    render(<MilestoneList milestones={ms} trajectory={traj} goalDirection="down" />);
    // projected 187 > 185 target with "down" direction → behind
    expect(screen.getByText("behind")).toBeInTheDocument();
  });
});
