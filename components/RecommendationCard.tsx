"use client";

import { useState } from "react";
import { useChatDrawer } from "@/lib/chat-drawer-context";
import type { GoalRecommendationView } from "@/lib/types";
import { fetchGoalHistory } from "@/lib/api";

function categoryColor(c: string): string {
  if (c === "nutrition") return "var(--accent-warm)";
  if (c === "training") return "var(--accent-primary)";
  if (c === "recovery") return "var(--accent-good)";
  if (c === "compliance") return "var(--accent-bad)";
  return "var(--muted)";
}

export function RecommendationCard({ rec }: { rec: GoalRecommendationView }) {
  const drawer = useChatDrawer();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<GoalRecommendationView[] | null>(null);

  async function loadHistory() {
    if (historyOpen) { setHistoryOpen(false); return; }
    if (history == null) {
      try {
        const resp = await fetchGoalHistory("hugo", 7);
        setHistory(resp.rows);
      } catch { setHistory([]); }
    }
    setHistoryOpen(true);
  }

  return (
    <div className="rounded-md hairline" style={{ background: "var(--surface)" }}>
      <div className="px-4 py-3">
        <div className="font-mono text-[10px] text-muted tracked uppercase">
          Today&apos;s recommendation · {rec.rec_date}
        </div>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text)" }}>
          {rec.narration}
        </p>
      </div>
      <ul className="border-t" style={{ borderColor: "var(--border-soft)" }}>
        {rec.actions.map((a, i) => (
          <li key={i} className="px-4 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--border-soft)" }}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[9px] tracked uppercase"
                    style={{ color: categoryColor(a.category) }}>
                {a.category}
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {a.change}
              </span>
            </div>
            <div className="font-mono text-[10px] text-muted mt-1">{a.rationale}</div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 border-t flex items-center justify-between"
           style={{ borderColor: "var(--border-soft)" }}>
        <button
          onClick={loadHistory}
          className="font-mono text-[10px] text-muted hover:opacity-80 transition"
        >
          {historyOpen ? "▼" : "▶"} Recent recommendations (last 7 days)
        </button>
        <button
          onClick={() => drawer.openWith("tell me more about today's recommendation")}
          className="font-mono text-[10px] hover:opacity-80 transition"
          style={{ color: "var(--accent-primary)" }}
        >
          Ask Claude about this →
        </button>
      </div>
      {historyOpen && history && (
        <div className="px-4 py-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
          {history.length === 0 ? (
            <div className="text-muted font-mono text-[10px]">No prior recommendations.</div>
          ) : (
            <ul>
              {history.map((h, i) => (
                <li key={i} className="py-1 border-b last:border-b-0"
                    style={{ borderColor: "var(--border-soft)" }}>
                  <span className="font-mono text-[10px] text-muted mr-2">{h.rec_date}</span>
                  <span className="text-sm" style={{ color: "var(--text)" }}>{h.narration}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
