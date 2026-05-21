import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChatDrawerProvider, useChatDrawer } from "@/lib/chat-drawer-context";

function Probe() {
  const drawer = useChatDrawer();
  return (
    <div>
      <span data-testid="open">{String(drawer.isOpen)}</span>
      <span data-testid="pending">{drawer.pendingInput ?? "none"}</span>
      <button onClick={() => drawer.openWith("hello")}>open</button>
      <button onClick={() => drawer.consumePendingInput()}>consume</button>
    </div>
  );
}

describe("ChatDrawerProvider", () => {
  it("openWith sets isOpen + pendingInput", () => {
    render(
      <ChatDrawerProvider>
        <Probe />
      </ChatDrawerProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText("open"));
    });
    expect(screen.getByTestId("open").textContent).toBe("true");
    expect(screen.getByTestId("pending").textContent).toBe("hello");
  });

  it("consumePendingInput clears pendingInput", () => {
    render(
      <ChatDrawerProvider>
        <Probe />
      </ChatDrawerProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText("open"));
    });
    act(() => {
      fireEvent.click(screen.getByText("consume"));
    });
    expect(screen.getByTestId("pending").textContent).toBe("none");
  });
});
