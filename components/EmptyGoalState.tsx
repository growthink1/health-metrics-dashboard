"use client";

import { useChatDrawer } from "@/lib/chat-drawer-context";

export function EmptyGoalState() {
  const drawer = useChatDrawer();
  return (
    <div className="rounded-md hairline p-10 flex flex-col items-center justify-center gap-4"
         style={{ background: "var(--surface)", minHeight: "60vh" }}>
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>No active goal yet.</h1>
      <p className="text-sm text-muted text-center max-w-md leading-relaxed">
        Tell Claude what you&apos;re working toward — they&apos;ll walk you through a short
        interview to set targets, milestones, and supporting subgoals.
      </p>
      <button
        onClick={() => drawer.openWith("Help me set my first goal")}
        className="h-9 px-5 rounded font-mono text-[12px] tracked-tight font-semibold hover:brightness-110 transition"
        style={{ background: "var(--accent-primary)", color: "#0a0e14" }}
      >
        Help me set my first goal →
      </button>
    </div>
  );
}
