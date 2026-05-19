"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStream } from "@/lib/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatToolUsePrompt } from "./ChatToolUsePrompt";

const STORAGE_KEY = "chat:drawer:state";

export function ChatDrawer() {
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const { messages, pendingToolUse, isStreaming, error, send, confirmToolUse } = useChatStream();

  // Persist collapsed state across reloads
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "collapsed") setCollapsed(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "open");
    }
  }, [collapsed]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, pendingToolUse]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || isStreaming) return;
    setInput("");
    send(t);
  }

  if (collapsed) {
    return (
      <aside
        className="shrink-0 flex flex-col items-center justify-between py-4 hairline cursor-pointer hover:bg-white/[0.02] transition"
        style={{ width: 32, background: "var(--surface)" }}
        onClick={() => setCollapsed(false)}
        title="Open Claude chat"
      >
        <button
          className="w-6 h-6 rounded hover:bg-white/5 flex items-center justify-center"
          aria-label="Open chat"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="var(--muted)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className="font-mono text-[10px] tracked text-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          ASK CLAUDE
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--accent-good)" }}
        />
      </aside>
    );
  }

  return (
    <aside
      className="shrink-0 flex flex-col hairline h-[calc(100vh-3.5rem)] sticky top-14"
      style={{ width: 360, background: "var(--surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-12 border-b shrink-0"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7eb5e0, #d44a8a)" }}
          >
            <span className="text-[10px] font-bold text-[#0a0e14]">C</span>
          </div>
          <div className="leading-none">
            <div className="text-[12px] font-semibold">Claude</div>
            <div
              className="font-mono text-[9px] tracked mt-0.5"
              style={{ color: "var(--accent-good)" }}
            >
              ● ONLINE
            </div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center"
          aria-label="Collapse chat"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 4l-4 4 4 4"
              stroke="var(--muted)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-[12px] text-muted italic leading-[1.5]">
            Ask about your data, or say things like &quot;log my weight 218&quot; or
            &quot;energy was 7 today&quot;.
          </div>
        ) : null}
        {messages.map((m, i) => (
          <ChatMessage
            key={i}
            message={m}
            isStreaming={isStreaming && i === messages.length - 1 && m.role === "assistant"}
          />
        ))}
        {pendingToolUse ? (
          <ChatToolUsePrompt
            tool={pendingToolUse}
            onConfirm={() => confirmToolUse(true)}
            onCancel={() => confirmToolUse(false)}
          />
        ) : null}
        {error ? (
          <div
            className="my-2 p-2 rounded font-mono text-[11px]"
            style={{
              background: "rgba(226,90,74,0.08)",
              color: "var(--accent-bad)",
              border: "1px solid rgba(226,90,74,0.3)",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="px-3 pb-3 pt-2 border-t shrink-0"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
      >
        <div
          className="flex items-center gap-2 rounded-md hairline px-3 h-11"
          style={{ background: "var(--surface-2)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Claude…"
            disabled={isStreaming}
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-2 disabled:opacity-50"
            style={{ color: "var(--text)" }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{
              background: input.trim() && !isStreaming ? "var(--accent-primary)" : "#1a2236",
            }}
            aria-label="Send"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8l12-6-5 14-2-6-5-2z"
                fill={input.trim() && !isStreaming ? "#0a0e14" : "var(--muted-2)"}
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="font-mono text-[9px] text-muted-2">
            ↵ send · ⇧↵ newline
          </span>
        </div>
      </form>
    </aside>
  );
}
