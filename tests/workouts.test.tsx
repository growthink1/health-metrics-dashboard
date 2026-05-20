import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WorkoutTable } from "@/components/WorkoutTable";
import type { Workout } from "@/lib/types";

const sampleWorkouts: Workout[] = [
  {
    id: 1,
    date: "2026-05-19",
    source: "manual",
    source_id: "abc",
    type: "strength",
    started_at: "2026-05-19T18:00:00Z",
    duration_min: 0,
    strain: null, kcal: null, avg_hr: null, max_hr: null,
    zones: { "0": null, "1": null, "2": null, "3": null, "4": null, "5": null },
  },
];

describe("WorkoutTable expandable rows", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(
      JSON.stringify({
        workout_id: 1,
        sets: [
          { id: 10, workout_id: 1, set_number: 1, exercise: "back squat", reps: 5, weight_lbs: 315, rpe: 8, notes: null, created_at: null },
          { id: 11, workout_id: 1, set_number: 2, exercise: "back squat", reps: 5, weight_lbs: 315, rpe: 8, notes: null, created_at: null },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders a chevron that expands to fetch and show sets", async () => {
    render(<WorkoutTable workouts={sampleWorkouts} />);
    const chevron = screen.getByLabelText(/expand row/i);
    fireEvent.click(chevron);
    await waitFor(() => expect(screen.getAllByText(/back squat/i)).toHaveLength(2));
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("renders 'no sets logged' for an expanded workout with empty sets", async () => {
    globalThis.fetch = vi.fn(async () => new Response(
      JSON.stringify({ workout_id: 1, sets: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

    render(<WorkoutTable workouts={sampleWorkouts} />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/expand row/i));
    });
    await waitFor(() => expect(screen.getByText(/no sets logged/i)).toBeInTheDocument(), { timeout: 3000 });
  });
});
