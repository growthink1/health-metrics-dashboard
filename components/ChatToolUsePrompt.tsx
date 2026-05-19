"use client";

import type { ToolUsePrompt } from "@/lib/chat";

interface Props {
  tool: ToolUsePrompt;
  onConfirm: () => void;
  onCancel: () => void;
}

function describeMetricFromName(name: string): string {
  // log_weight → weight, log_subjective → subjective, log_nutrition → nutrition
  return name.replace(/^log_/, "");
}

export function ChatToolUsePrompt({ tool, onConfirm, onCancel }: Props) {
  const metric = describeMetricFromName(tool.name);
  const entries = Object.entries(tool.input);

  return (
    <div
      className="mt-2 rounded-md hairline overflow-hidden"
      style={{ background: "var(--surface-2)" }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M8 3v10"
            stroke="var(--accent-warm)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="font-mono text-[10px] tracked"
          style={{ color: "var(--accent-warm)" }}
        >
          TOOL · {tool.name}
        </span>
        <span className="ml-auto font-mono text-[9px] text-muted-2">requires confirm</span>
      </div>
      <div className="px-3 py-2.5">
        <div
          className="font-mono text-[11px] leading-[1.55]"
          style={{ color: "var(--text)" }}
        >
          <div>
            <span className="text-muted">action :</span> {metric}
          </div>
          {entries.map(([k, v]) => (
            <div key={k}>
              <span className="text-muted">{k.padEnd(7, " ").slice(0, 7)}:</span>{" "}
              <span>{typeof v === "string" ? v : JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        className="px-3 py-2 flex gap-2 border-t"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <button
          onClick={onConfirm}
          className="flex-1 h-7 rounded font-mono text-[11px] tracked-tight font-semibold hover:brightness-110 transition"
          style={{ background: "var(--accent-good)", color: "#06160f" }}
        >
          CONFIRM
        </button>
        <button
          onClick={onCancel}
          className="flex-1 h-7 rounded font-mono text-[11px] tracked-tight hairline hover:bg-white/5 transition text-muted"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
