import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SubgoalList } from "@/components/SubgoalList";
import type { Subgoal } from "@/lib/types";

const subgoals: Subgoal[] = [
  { preset: "avg_kcal", target_value: 2100, window_days: 7, current_value: 2070, compliance_pct: 94 },
  { preset: "workouts_per_week", target_value: 4, window_days: 7, current_value: 3, compliance_pct: 75 },
];

describe("SubgoalList", () => {
  it("renders compliance percent for each subgoal", () => {
    render(<SubgoalList subgoals={subgoals} />);
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("opens drawer on row click and closes on second click", () => {
    render(<SubgoalList subgoals={subgoals} />);
    fireEvent.click(screen.getByLabelText(/Toggle avg_kcal drawer/));
    expect(screen.getByText(/Why am I at 94%/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Toggle avg_kcal drawer/));
    expect(screen.queryByText(/Why am I at 94%/)).toBeNull();
  });

  it("clicking another row collapses the first", () => {
    render(<SubgoalList subgoals={subgoals} />);
    fireEvent.click(screen.getByLabelText(/Toggle avg_kcal drawer/));
    expect(screen.getByText(/Why am I at 94%/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Toggle workouts_per_week drawer/));
    expect(screen.queryByText(/Why am I at 94%/)).toBeNull();
    expect(screen.getByText(/Why am I at 75%/)).toBeInTheDocument();
  });
});
