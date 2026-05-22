"use client";

import { useChatDrawer } from "@/lib/chat-drawer-context";
import { ChatPanel } from "./ChatPanel";

export function ChatDrawer() {
  const drawer = useChatDrawer();
  if (drawer.hidden) return null;

  const collapsed = !drawer.isOpen;
  const setCollapsed = (v: boolean) => drawer.setOpen(!v);

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
            <path d="M6 4l4 4-4 4" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          className="font-mono text-[10px] tracked text-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          ASK CLAUDE
        </div>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-good)" }} />
      </aside>
    );
  }

  return (
    <aside
      className="shrink-0 flex flex-col hairline h-[calc(100vh-3.5rem)] sticky top-14"
      style={{ width: 360, background: "var(--surface)" }}
    >
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
            <div className="font-mono text-[9px] tracked mt-0.5" style={{ color: "var(--accent-good)" }}>
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
            <path d="M10 4l-4 4 4 4" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <ChatPanel />
    </aside>
  );
}
