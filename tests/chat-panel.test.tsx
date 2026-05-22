import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatDrawerProvider } from "@/lib/chat-drawer-context";

// Mock useChatStream so the panel renders without hitting fetch.
vi.mock("@/lib/chat", () => ({
  useChatStream: vi.fn(() => ({
    messages: [],
    pendingToolUse: null,
    isStreaming: false,
    error: null,
    send: vi.fn(),
    confirmToolUse: vi.fn(),
    cancel: vi.fn(),
  })),
  READ_TOOL_NAMES: new Set<string>(),
}));

describe("ChatPanel", () => {
  it("renders the default placeholder", () => {
    render(<ChatDrawerProvider><ChatPanel /></ChatDrawerProvider>);
    expect(screen.getByPlaceholderText(/ask claude/i)).toBeInTheDocument();
  });

  it("renders a custom inputPlaceholder", () => {
    render(
      <ChatDrawerProvider>
        <ChatPanel inputPlaceholder="e.g. lose 15 lbs by August" />
      </ChatDrawerProvider>
    );
    expect(screen.getByPlaceholderText(/lose 15 lbs/i)).toBeInTheDocument();
  });

  it("focuses the input when autoFocus is true", () => {
    render(
      <ChatDrawerProvider>
        <ChatPanel autoFocus inputPlaceholder="focus me" />
      </ChatDrawerProvider>
    );
    expect(screen.getByPlaceholderText(/focus me/i)).toHaveFocus();
  });

  it("passes onToolConfirm into useChatStream options", async () => {
    const { useChatStream } = await import("@/lib/chat");
    const handler = vi.fn();
    render(
      <ChatDrawerProvider>
        <ChatPanel onToolConfirm={handler} />
      </ChatDrawerProvider>
    );
    expect(vi.mocked(useChatStream)).toHaveBeenCalledWith(
      expect.objectContaining({ onToolConfirm: handler })
    );
  });
});
