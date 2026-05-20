"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStream } from "@/lib/chat";
import { useVoiceInput } from "@/lib/voice";
import { ChatMessage } from "./ChatMessage";
import { ChatToolUsePrompt } from "./ChatToolUsePrompt";
import type { ImageAttachment } from "@/lib/types";

const STORAGE_KEY = "chat:drawer:state";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface PendingImage {
  dataUrl: string;
  base64: string;
  mediaType: string;
  byteSize: number;
}

export function ChatDrawer() {
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { messages, pendingToolUse, isStreaming, error, send, confirmToolUse } = useChatStream();
  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } = useVoiceInput({
    onTranscript: (t) => setInput((prev) => (prev ? prev + " " + t : t)),
  });

  // Track the most-recent attached image so the tool-use card can render the
  // thumbnail without a server round-trip.
  const lastImageRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingImage) lastImageRef.current = pendingImage.dataUrl;
  }, [pendingImage]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "collapsed") setCollapsed(true);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "open");
    }
  }, [collapsed]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, pendingToolUse]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      alert(`Photo too large; max ${MAX_IMAGE_BYTES / 1024 / 1024}MB`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      setPendingImage({ dataUrl, base64, mediaType: f.type || "image/jpeg", byteSize: f.size });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (isStreaming) return;
    if (!t && !pendingImage) return;
    const attachments: ImageAttachment[] | undefined = pendingImage
      ? [{ type: "image", mediaType: pendingImage.mediaType, data: pendingImage.base64 }]
      : undefined;
    setInput("");
    setPendingImage(null);
    send(t, attachments);
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

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-[12px] text-muted italic leading-[1.5]">
            Ask about your data, attach a meal photo, or say things like &quot;log my weight 218&quot;
            or &quot;back squat 5 reps 315&quot;.
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
            previewDataUrl={lastImageRef.current ?? undefined}
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

      <form
        onSubmit={onSubmit}
        className="px-3 pb-3 pt-2 border-t shrink-0"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
      >
        {pendingImage ? (
          <div className="flex items-center gap-2 px-1 pb-2">
            <div className="relative" style={{ width: 40, height: 40 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImage.dataUrl} alt="attached" className="rounded object-cover" style={{ width: 40, height: 40 }} />
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                aria-label="Remove image"
                className="absolute -top-1 -right-1 rounded-full text-[10px] flex items-center justify-center"
                style={{ width: 16, height: 16, background: "var(--accent-bad)", color: "#fff" }}
              >
                ×
              </button>
            </div>
            <span className="font-mono text-[10px] text-muted">{Math.round(pendingImage.byteSize / 1024)} KB</span>
          </div>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPickFile}
        />

        <div
          className="flex items-center gap-2 rounded-md hairline px-2 h-11"
          style={{ background: "var(--surface-2)" }}
        >
          {voiceSupported ? (
            <button
              type="button"
              onClick={() => (listening ? stopVoice() : startVoice())}
              aria-label={listening ? "Stop voice" : "Start voice"}
              title={listening ? "Listening… click to stop" : "Voice input"}
              className="w-7 h-7 rounded flex items-center justify-center transition"
              style={{
                background: listening ? "var(--accent-bad)" : "transparent",
                color: listening ? "#fff" : "var(--muted)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2a2 2 0 0 0-2 2v4a2 2 0 1 0 4 0V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 8a4 4 0 1 0 8 0M8 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach photo"
            title="Attach photo"
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5 transition text-muted"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M11 7l-4 4a2 2 0 1 1-3-3l5-5a3 3 0 0 1 4 4l-6 6a4 4 0 0 1-6-6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask Claude…"}
            disabled={isStreaming}
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-2 disabled:opacity-50"
            style={{ color: "var(--text)" }}
          />

          <button
            type="submit"
            disabled={isStreaming || (!input.trim() && !pendingImage)}
            className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{
              background: (input.trim() || pendingImage) && !isStreaming ? "var(--accent-primary)" : "#1a2236",
            }}
            aria-label="Send"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l12-6-5 14-2-6-5-2z" fill={(input.trim() || pendingImage) && !isStreaming ? "#0a0e14" : "var(--muted-2)"} />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="font-mono text-[9px] text-muted-2">
            ↵ send · ⇧↵ newline · 📎 photo {voiceSupported ? "· 🎤 voice" : ""}
          </span>
        </div>
      </form>
    </aside>
  );
}
