import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatDrawerProvider } from "@/lib/chat-drawer-context";
import { EmptyGoalState } from "@/components/EmptyGoalState";

describe("Goals empty state", () => {
  it("renders the CTA and openWith on click", () => {
    render(<ChatDrawerProvider><EmptyGoalState /></ChatDrawerProvider>);
    expect(screen.getByText(/No active goal yet/)).toBeInTheDocument();
    const btn = screen.getByText(/Help me set my first goal/);
    expect(btn).toBeInTheDocument();
  });
});
