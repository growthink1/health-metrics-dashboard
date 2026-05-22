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

  it("setHidden updates hidden value", () => {
    function HiddenProbe() {
      const drawer = useChatDrawer();
      return (
        <div>
          <span data-testid="hidden">{String(drawer.hidden)}</span>
          <button onClick={() => drawer.setHidden(true)}>hide</button>
          <button onClick={() => drawer.setHidden(false)}>show</button>
        </div>
      );
    }
    render(<ChatDrawerProvider><HiddenProbe /></ChatDrawerProvider>);
    expect(screen.getByTestId("hidden").textContent).toBe("false");
    act(() => { fireEvent.click(screen.getByText("hide")); });
    expect(screen.getByTestId("hidden").textContent).toBe("true");
    act(() => { fireEvent.click(screen.getByText("show")); });
    expect(screen.getByTestId("hidden").textContent).toBe("false");
  });
});
