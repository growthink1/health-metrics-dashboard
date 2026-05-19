"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/chat";

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-3 py-2 rounded-lg rounded-br-sm text-[13px] leading-[1.45]"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div
        className="w-6 h-6 shrink-0 rounded-full mt-0.5 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #7eb5e0, #d44a8a)" }}
      >
        <span className="text-[9px] font-bold text-[#0a0e14]">C</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] leading-[1.55]" style={{ color: "var(--text)" }}>
          {message.content}
          {isStreaming ? (
            <span
              className="caret align-middle"
              style={{ background: "var(--accent-primary)" }}
            />
          ) : null}
        </div>
        {message.toolUse ? (
          <div className="mt-1.5 font-mono text-[10px] text-muted-2">
            ✓ {message.toolUse.name}(…)
          </div>
        ) : null}
      </div>
    </div>
  );
}
