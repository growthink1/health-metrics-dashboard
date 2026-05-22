"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatPanel } from "./ChatPanel";
import { useChatDrawer } from "@/lib/chat-drawer-context";

export function GoalSetupPanel() {
  const drawer = useChatDrawer();
  const router = useRouter();

  useEffect(() => {
    drawer.setHidden(true);
    return () => drawer.setHidden(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6 h-full min-h-0 flex flex-col">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Set your first goal
        </h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Tell me what you&apos;re working toward and I&apos;ll walk you through it.
        </p>
      </header>
      <div
        className="flex-1 min-h-[60vh] rounded-md hairline"
        style={{ background: "var(--surface)", borderColor: "var(--border-soft)" }}
      >
        <ChatPanel
          autoFocus
          inputPlaceholder="e.g. lose 15 lbs by August"
          onToolConfirm={(name, approved) => {
            if (name === "set_primary_goal" && approved) {
              router.refresh();
            }
          }}
        />
      </div>
    </div>
  );
}
