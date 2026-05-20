"use client";

import type { ToolUsePrompt } from "@/lib/chat";

interface Props {
  tool: ToolUsePrompt;
  previewDataUrl?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function describeMetricFromName(name: string): string {
  return name.replace(/^log_/, "");
}

export function ChatToolUsePrompt({ tool, previewDataUrl, onConfirm, onCancel }: Props) {
  const metric = describeMetricFromName(tool.name);
  const entries = Object.entries(tool.input);
  const hasPhoto =
    typeof tool.input["photo_path"] === "string" && tool.input["photo_path"];
  const showThumb = hasPhoto && previewDataUrl;

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
          <path d="M3 8h10M8 3v10" stroke="var(--accent-warm)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="font-mono text-[10px] tracked" style={{ color: "var(--accent-warm)" }}>
          TOOL · {tool.name}
        </span>
        <span className="ml-auto font-mono text-[9px] text-muted-2">requires confirm</span>
      </div>

      <div className="px-3 py-2.5 flex gap-3">
        {showThumb ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewDataUrl}
            alt="meal preview"
            className="rounded shrink-0"
            style={{ width: 64, height: 64, objectFit: "cover" }}
          />
        ) : null}
        <div className="flex-1 font-mono text-[11px] leading-[1.55]" style={{ color: "var(--text)" }}>
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

      <div className="px-3 py-2 flex gap-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
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
