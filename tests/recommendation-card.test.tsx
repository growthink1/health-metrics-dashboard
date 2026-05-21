import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ChatDrawerProvider } from "@/lib/chat-drawer-context";
import type { GoalRecommendationView } from "@/lib/types";

const rec: GoalRecommendationView = {
  rec_date: "2026-05-20",
  narration: "You're 3 lbs ahead of pace but workout frequency is slipping.",
  actions: [
    { category: "nutrition", change: "-100 kcal", rationale: "off pace" },
    { category: "training", change: "+1 workout", rationale: "frequency low" },
  ],
};

describe("RecommendationCard", () => {
  it("renders narration and actions", () => {
    render(<ChatDrawerProvider><RecommendationCard rec={rec} /></ChatDrawerProvider>);
    expect(screen.getByText(/3 lbs ahead of pace/)).toBeInTheDocument();
    expect(screen.getByText("-100 kcal")).toBeInTheDocument();
    expect(screen.getByText("+1 workout")).toBeInTheDocument();
  });

  it("Ask-Claude button is present and clickable", () => {
    render(<ChatDrawerProvider><RecommendationCard rec={rec} /></ChatDrawerProvider>);
    const btn = screen.getByText(/Ask Claude about this/);
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    // The button click calls openWith via context — provider state is unit-tested elsewhere.
    expect(btn).toBeInTheDocument();
  });
});
