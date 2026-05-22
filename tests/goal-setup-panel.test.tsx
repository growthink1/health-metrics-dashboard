import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatDrawerProvider, useChatDrawer } from "@/lib/chat-drawer-context";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

// Mock ChatPanel so we can directly invoke the onToolConfirm prop the test asserts on.
let lastOnToolConfirm: ((name: string, approved: boolean) => void) | undefined;
vi.mock("@/components/ChatPanel", () => ({
  ChatPanel: ({ onToolConfirm }: { onToolConfirm?: (n: string, a: boolean) => void }) => {
    lastOnToolConfirm = onToolConfirm;
    return <div data-testid="chat-panel-mock" />;
  },
}));

import { GoalSetupPanel } from "@/components/GoalSetupPanel";

function HiddenProbe() {
  const drawer = useChatDrawer();
  return <span data-testid="hidden">{String(drawer.hidden)}</span>;
}

beforeEach(() => {
  refreshMock.mockReset();
  lastOnToolConfirm = undefined;
});

describe("GoalSetupPanel", () => {
  it("renders the heading and subtitle", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    expect(screen.getByRole("heading", { name: /set your first goal/i })).toBeInTheDocument();
    expect(screen.getByText(/working toward/i)).toBeInTheDocument();
  });

  it("calls setHidden(true) on mount", () => {
    render(
      <ChatDrawerProvider>
        <HiddenProbe />
        <GoalSetupPanel />
      </ChatDrawerProvider>
    );
    expect(screen.getByTestId("hidden").textContent).toBe("true");
  });

  it("calls router.refresh when onToolConfirm fires for set_primary_goal with approved=true", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    expect(lastOnToolConfirm).toBeDefined();
    act(() => { lastOnToolConfirm!("set_primary_goal", true); });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT call router.refresh when approved=false", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    act(() => { lastOnToolConfirm!("set_primary_goal", false); });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does NOT call router.refresh for other tool names", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    act(() => { lastOnToolConfirm!("add_subgoal", true); });
    act(() => { lastOnToolConfirm!("update_goal", true); });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
