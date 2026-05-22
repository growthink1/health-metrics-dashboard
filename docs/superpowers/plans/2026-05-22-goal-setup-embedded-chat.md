# Embedded Goal-Setup Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the goal-setup interview from the right-side `ChatDrawer` into a `GoalSetupPanel` rendered in the main content area of `/goals` when no active goal exists; hide the drawer on that route; refresh the page once the user confirms `set_primary_goal`.

**Architecture:** Extract the chat UI from `ChatDrawer.tsx` into a reusable `ChatPanel.tsx`. `ChatDrawer` becomes a thin wrapper that adds drawer chrome. `GoalSetupPanel` mounts the same `ChatPanel` inline. `ChatDrawerContext` gains a `hidden` flag so the drawer can be suppressed page-by-page. `useChatStream` gains an optional `onToolConfirm` callback so the panel can react to tool-use confirmations (specifically: refresh the server component when `set_primary_goal` is approved).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, vitest, Playwright. No backend changes. No new dependencies.

**Repo:** `~/code/health-metrics-dashboard` — branch `main`, head `1eeaf24` at plan-write time (post-T13 `/goals` page landing). Spec at `docs/superpowers/specs/2026-05-22-goal-setup-embedded-chat-design.md`.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `lib/chat-drawer-context.tsx` | Modify | Add `hidden: boolean` + `setHidden(v: boolean)` to the context interface and provider. |
| `lib/chat.ts` | Modify | Add optional `onToolConfirm` to `useChatStream`'s options. Make `confirmToolUse` async; fire callback after the post-confirm stream resolves. |
| `components/ChatPanel.tsx` | Create | Pure chat UI: messages list, input + send + mic + image attach + tool-use confirm cards. Accepts `autoFocus`, `inputPlaceholder`, `onToolConfirm` props. |
| `components/ChatDrawer.tsx` | Modify | Becomes a thin wrapper: drawer chrome (collapse handle, fixed width, sticky) around `<ChatPanel inputPlaceholder="Ask Claude…" />`. Returns `null` when `drawer.hidden === true`. |
| `components/GoalSetupPanel.tsx` | Create | h1 "Set your first goal" + 1-line subtitle + `<ChatPanel autoFocus inputPlaceholder="e.g. lose 15 lbs by August" onToolConfirm={…} />`. On mount calls `setHidden(true)`; on unmount calls `setHidden(false)`. Wires `set_primary_goal` + approved=true → `router.refresh()`. |
| `app/goals/page.tsx` | Modify | When `status.goal == null`, render `<GoalSetupPanel />` instead of `<EmptyGoalState />`. |
| `components/EmptyGoalState.tsx` | Delete | Replaced by `GoalSetupPanel`. |
| `tests/chat-drawer-context.test.tsx` | Modify | Add a `setHidden` test alongside the existing `openWith` / `consumePendingInput` tests. |
| `tests/chat-panel.test.tsx` | Create | Mount + placeholder + autoFocus + `onToolConfirm` invocation via a mocked `useChatStream`. |
| `tests/goal-setup-panel.test.tsx` | Create | Mocks `ChatPanel`. Asserts `setHidden(true)` on mount; `router.refresh()` only when callback fires with `("set_primary_goal", true)`. |
| `tests/goals.test.tsx` | Delete | Was the `EmptyGoalState` test; component is gone. |
| `tests/e2e/v4.spec.ts` | Modify | Update empty-state assertions to look for the new h1 + focused embedded input; assert right drawer is not in DOM. |

---

## Conventions

1. **TDD discipline.** Each task writes a failing test first, then implements, then verifies pass. Single commit per task.
2. **Branching: direct-to-main** (matches v4 plan + Hugo's house style).
3. **Commit message format:** `feat(dashboard): <verb-noun> (v4 followup: embedded goal chat T<N>)`.
4. **Test count baseline:** 31 vitest + 3 Playwright at start. Target end state: 32 vitest + 3 Playwright (one new chat-panel test + one new goal-setup-panel test + one deleted goals.test.tsx — net +1; chat-drawer-context.test.tsx adds 1 test but stays at 1 file).
5. **No backend changes.** `/api/chat` already handles the interview addendum from v4 T6.

---

## Task 1: ChatDrawerContext gains `hidden` + `setHidden`

**Files:**
- Modify: `lib/chat-drawer-context.tsx`
- Modify: `tests/chat-drawer-context.test.tsx`

- [ ] **Step 1: Add failing test**

In `tests/chat-drawer-context.test.tsx`, append a new test inside the existing `describe("ChatDrawerProvider", ...)` block (after the existing two tests):

```tsx
  it("setHidden updates hidden value", () => {
    function HiddenProbe() {
      const drawer = useChatDrawer();
      return (
        <div>
          <span data-testid="hidden">{String(drawer.hidden)}</span>
          <button onClick={() => drawer.setHidden(true)}>hide</button>
          <button onClick={() => drawer.setHidden(false)}>show</button>
        </div>
      );
    }
    render(<ChatDrawerProvider><HiddenProbe /></ChatDrawerProvider>);
    expect(screen.getByTestId("hidden").textContent).toBe("false");
    act(() => { fireEvent.click(screen.getByText("hide")); });
    expect(screen.getByTestId("hidden").textContent).toBe("true");
    act(() => { fireEvent.click(screen.getByText("show")); });
    expect(screen.getByTestId("hidden").textContent).toBe("false");
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/code/health-metrics-dashboard
npx vitest run tests/chat-drawer-context.test.tsx
```
Expected: FAIL — `drawer.hidden` is `undefined` (property doesn't exist).

- [ ] **Step 3: Implement `hidden` + `setHidden` in the context**

Modify `lib/chat-drawer-context.tsx`. Update the `ChatDrawerContextValue` interface:

```tsx
interface ChatDrawerContextValue {
  pendingInput: string | null;
  isOpen: boolean;
  hidden: boolean;
  consumePendingInput: () => string | null;
  openWith: (text: string) => void;
  setOpen: (open: boolean) => void;
  setHidden: (hidden: boolean) => void;
}
```

Update the default context value (the `createContext(...)` argument):

```tsx
export const ChatDrawerContext = createContext<ChatDrawerContextValue>({
  pendingInput: null,
  isOpen: true,
  hidden: false,
  consumePendingInput: () => null,
  openWith: noop,
  setOpen: noop,
  setHidden: noop,
});
```

Update the provider body — add a `hidden` state next to `isOpen`:

```tsx
export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const [pendingInput, setPending] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [hidden, setHidden] = useState(false);

  const openWith = useCallback((text: string) => {
    setPending(text);
    setIsOpen(true);
  }, []);

  const consumePendingInput = useCallback(() => {
    const v = pendingInput;
    setPending(null);
    return v;
  }, [pendingInput]);

  return (
    <ChatDrawerContext.Provider value={{
      pendingInput, isOpen, hidden,
      openWith, setOpen: setIsOpen, setHidden,
      consumePendingInput,
    }}>
      {children}
    </ChatDrawerContext.Provider>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/chat-drawer-context.test.tsx
```
Expected: 3/3 PASS (the existing 2 + the new one).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no new errors. (Pre-existing `tests/api.test.ts:90` tuple-index error is unrelated.)

- [ ] **Step 6: Commit**

```bash
git add lib/chat-drawer-context.tsx tests/chat-drawer-context.test.tsx
git commit -m "feat(dashboard): ChatDrawerContext gains hidden + setHidden (v4 followup: embedded goal chat T1)"
git push
```

---

## Task 2: `useChatStream` gains `onToolConfirm` callback

**Files:**
- Modify: `lib/chat.ts`

No test file change here — the callback is exercised indirectly by ChatPanel + GoalSetupPanel tests in T3/T4. (Adding a `useChatStream` unit test would require mocking `fetch` + SSE which is the cost the spec called out as a deferred concern. The callback shape is simple enough that the integration-level tests in T3/T4 suffice.)

- [ ] **Step 1: Read the current `useChatStream` signature**

Inspect `lib/chat.ts` at the `export function useChatStream()` declaration (around line 35) and the `confirmToolUse` definition (around lines 157–178). Note that `confirmToolUse` is currently synchronous and calls `void runStream(...)` (fire-and-forget).

- [ ] **Step 2: Modify `useChatStream` signature**

Change the export from:

```ts
export function useChatStream() { ... }
```

to:

```ts
export interface UseChatStreamOptions {
  /** Fired after a tool-use confirmation round-trip resolves. `approved`
   * mirrors the user's click on the confirm card. */
  onToolConfirm?: (toolName: string, approved: boolean) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) { ... }
```

- [ ] **Step 3: Make `confirmToolUse` async and fire the callback**

Replace the existing `confirmToolUse` definition with:

```ts
  const confirmToolUse = useCallback(async (approved: boolean) => {
    if (!pendingToolUse) return;
    const tu = pendingToolUse;
    setPendingToolUse(null);
    const continued: ChatMessage[] = [];
    setMessages((prev) => {
      const c: ChatMessage[] = [...prev];
      const lastIdx = c.length - 1;
      if (lastIdx >= 0 && c[lastIdx].role === "assistant") {
        c[lastIdx] = { ...c[lastIdx], toolUse: tu };
      }
      continued.push(...c);
      return c;
    });
    await runStream(
      {
        messages: continued.map(toApi),
        tool_confirmation: { id: tu.id, approved },
      },
      continued,
    );
    options.onToolConfirm?.(tu.name, approved);
  }, [pendingToolUse, runStream, options]);
```

Notes:
- The function is now `async`; existing callers in `ChatDrawer.tsx` use it as fire-and-forget (`confirmToolUse(approved)`) which is still valid — promise rejections inside an unawaited async call surface as unhandled rejections only if `runStream` throws. `runStream` already catches its own errors and writes them to the `error` state, so no unhandled rejection.
- The callback fires after `runStream` resolves — meaning the backend has finished writing the tool result and committed the goal (or returned an error). At that point a `router.refresh()` is safe.
- `options` is in the dep array so the callback identity is current.

- [ ] **Step 4: Run vitest to verify nothing regressed**

```bash
cd ~/code/health-metrics-dashboard
npx vitest run
```
Expected: 31/31 still pass (no new tests; just verifying the refactor is non-breaking).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add lib/chat.ts
git commit -m "feat(dashboard): useChatStream gains optional onToolConfirm callback (v4 followup: embedded goal chat T2)"
git push
```

---

## Task 3: Extract `ChatPanel.tsx` from `ChatDrawer.tsx`

**Files:**
- Create: `components/ChatPanel.tsx`
- Modify: `components/ChatDrawer.tsx`
- Create: `tests/chat-panel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/chat-panel.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/chat-panel.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/ChatPanel'`.

- [ ] **Step 3: Create `components/ChatPanel.tsx`**

The file consolidates everything in the existing `components/ChatDrawer.tsx` except the drawer chrome (the collapsed-stub + the outer `<aside>` shell). Create `components/ChatPanel.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStream, type UseChatStreamOptions } from "@/lib/chat";
import { useVoiceInput } from "@/lib/voice";
import { useChatDrawer } from "@/lib/chat-drawer-context";
import { ChatMessage } from "./ChatMessage";
import { ChatToolUsePrompt } from "./ChatToolUsePrompt";
import type { ImageAttachment } from "@/lib/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface PendingImage {
  dataUrl: string;
  base64: string;
  mediaType: string;
  byteSize: number;
}

export interface ChatPanelProps {
  /** Auto-focus the input on mount. Default false. */
  autoFocus?: boolean;
  /** Placeholder text for the input. Default "Ask Claude…" */
  inputPlaceholder?: string;
  /** Forwarded to useChatStream — fires after a tool-use confirm round-trip. */
  onToolConfirm?: UseChatStreamOptions["onToolConfirm"];
}

export function ChatPanel({
  autoFocus = false,
  inputPlaceholder = "Ask Claude…",
  onToolConfirm,
}: ChatPanelProps) {
  const drawer = useChatDrawer();
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages, pendingToolUse, isStreaming, error, send, confirmToolUse } =
    useChatStream({ onToolConfirm });
  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } = useVoiceInput({
    onTranscript: (t) => setInput((prev) => (prev ? prev + " " + t : t)),
  });

  const lastImageRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingImage) lastImageRef.current = pendingImage.dataUrl;
  }, [pendingImage]);

  // Prefill input from context's pendingInput (kept from T9).
  useEffect(() => {
    if (drawer.pendingInput) {
      setInput(drawer.pendingInput);
      drawer.consumePendingInput();
      drawer.setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.pendingInput]);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

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

  // === BEGIN: paste the existing JSX message-list + input rendering ===
  //
  // The full render body that follows is identical to the current
  // ChatDrawer.tsx render body BUT with these adjustments:
  //  - Remove the `if (collapsed) return <aside>…</aside>` early-return — drawer
  //    chrome is no longer ChatPanel's job. ChatPanel always renders the full
  //    chat surface; mounting/sizing is the parent's responsibility.
  //  - Replace the outer `<aside className="…drawer chrome…">` wrapper with
  //    a plain `<section className="flex flex-col h-full min-h-0">…</section>`.
  //    No fixed width, no sticky positioning, no collapse button.
  //  - Replace any `<textarea placeholder="Ask Claude…" />` literal with
  //    `<textarea ref={inputRef} placeholder={inputPlaceholder} />`.
  //  - Leave the message-list, ChatMessage, ChatToolUsePrompt, attach button,
  //    mic button, send button, and error rendering exactly as they are in
  //    ChatDrawer.tsx.
  //
  // === END: paste the existing JSX message-list + input rendering ===

  return (
    <section className="flex flex-col h-full min-h-0">
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-3"
      >
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
        {pendingToolUse && (
          <ChatToolUsePrompt
            tool={pendingToolUse}
            previewImageDataUrl={lastImageRef.current}
            onConfirm={(approved) => void confirmToolUse(approved)}
          />
        )}
        {error && (
          <div className="text-xs font-mono" style={{ color: "var(--accent-bad)" }}>
            {error}
          </div>
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
        {pendingImage && (
          <div
            className="px-3 py-2 flex items-center gap-2 border-b"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <img
              src={pendingImage.dataUrl}
              alt="attachment"
              className="h-10 w-10 object-cover rounded"
            />
            <button
              type="button"
              className="text-xs text-muted hover:underline"
              onClick={() => setPendingImage(null)}
            >
              remove
            </button>
          </div>
        )}
        <div className="px-3 py-2 flex items-end gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileRef}
            onChange={onPickFile}
          />
          <button
            type="button"
            aria-label="Attach image"
            className="text-muted hover:text-text"
            onClick={() => fileRef.current?.click()}
          >
            📎
          </button>
          {voiceSupported && (
            <button
              type="button"
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              className="text-muted hover:text-text"
              onClick={() => (listening ? stopVoice() : startVoice())}
            >
              {listening ? "🎙️" : "🎤"}
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={inputPlaceholder}
            rows={1}
            className="flex-1 min-h-[2.25rem] max-h-32 resize-none rounded px-2 py-1 text-sm bg-transparent border"
            style={{ borderColor: "var(--border-soft)", color: "var(--text)" }}
          />
          <button
            type="submit"
            disabled={isStreaming || (!input.trim() && !pendingImage)}
            className="text-sm font-mono px-3 py-1 rounded font-semibold disabled:opacity-40"
            style={{ background: "var(--accent-primary)", color: "#0a0e14" }}
          >
            {isStreaming ? "…" : "→"}
          </button>
        </div>
      </form>
    </section>
  );
}
```

**Important:** the JSX rendering above is a faithful representation of what `ChatDrawer.tsx` renders today, structured for `ChatPanel`'s simpler container model. If the existing ChatDrawer JSX has slight differences (e.g., specific class names, button ordering, or aria labels), preserve those exact strings when copying over — Playwright assertions and existing UX depend on them. The textarea must use `ref={inputRef}` so the autoFocus effect can grab it.

- [ ] **Step 4: Refactor `components/ChatDrawer.tsx` into a thin shell**

Replace the entire contents of `components/ChatDrawer.tsx` with:

```tsx
"use client";

import { useChatDrawer } from "@/lib/chat-drawer-context";
import { ChatPanel } from "./ChatPanel";

export function ChatDrawer() {
  const drawer = useChatDrawer();
  if (drawer.hidden) return null;

  const collapsed = !drawer.isOpen;

  if (collapsed) {
    return (
      <aside
        className="hidden md:flex w-10 shrink-0 border-l items-start justify-center pt-3"
        style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
      >
        <button
          type="button"
          aria-label="Open chat"
          className="text-muted hover:text-text"
          onClick={() => drawer.setOpen(true)}
        >
          💬
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="hidden md:flex w-80 shrink-0 border-l flex-col min-h-0"
      style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
    >
      <header
        className="px-3 py-2 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <span className="font-mono text-[11px] tracked uppercase text-muted">Chat</span>
        <button
          type="button"
          aria-label="Collapse chat"
          className="text-muted hover:text-text"
          onClick={() => drawer.setOpen(false)}
        >
          ›
        </button>
      </header>
      <ChatPanel />
    </aside>
  );
}
```

Notes:
- The class names, widths, and aria labels above mirror the existing drawer's structure. If the current `ChatDrawer.tsx` uses different class names for the collapsed handle or header, preserve those — Playwright + the existing v2/v3 specs may depend on them.
- `ChatPanel` is rendered with NO props — drawer mode uses the default "Ask Claude…" placeholder, no autoFocus, no onToolConfirm.
- `drawer.hidden` short-circuits to `null` so `GoalSetupPanel` (T4) can suppress the drawer.

- [ ] **Step 5: Run vitest to verify the new test + no regressions**

```bash
cd ~/code/health-metrics-dashboard
npx vitest run
```
Expected: 35/35 PASS (31 previous + 4 new in chat-panel.test.tsx). No vitest test directly mounts `ChatDrawer.tsx`, so the refactor doesn't break existing test counts.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 7: Manual smoke (dev server)**

If a local dev server is already running on port 3000, navigate to `/` and confirm the right-side chat drawer still appears, the input accepts text, and the collapse button works. If no dev server is running, skip this step — T6's Playwright run catches regressions.

- [ ] **Step 8: Commit**

```bash
git add components/ChatPanel.tsx components/ChatDrawer.tsx tests/chat-panel.test.tsx
git commit -m "feat(dashboard): extract ChatPanel from ChatDrawer; drawer becomes thin shell (v4 followup: embedded goal chat T3)"
git push
```

---

## Task 4: Create `GoalSetupPanel.tsx` + test

**Files:**
- Create: `components/GoalSetupPanel.tsx`
- Create: `tests/goal-setup-panel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/goal-setup-panel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatDrawerProvider, useChatDrawer } from "@/lib/chat-drawer-context";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

// Mock ChatPanel so we can directly invoke the onToolConfirm prop the test asserts on.
let lastOnToolConfirm: ((name: string, approved: boolean) => void) | undefined;
vi.mock("@/components/ChatPanel", () => ({
  ChatPanel: ({ onToolConfirm }: { onToolConfirm?: (n: string, a: boolean) => void }) => {
    lastOnToolConfirm = onToolConfirm;
    return <div data-testid="chat-panel-mock" />;
  },
}));

import { GoalSetupPanel } from "@/components/GoalSetupPanel";

function HiddenProbe() {
  const drawer = useChatDrawer();
  return <span data-testid="hidden">{String(drawer.hidden)}</span>;
}

beforeEach(() => {
  refreshMock.mockReset();
  lastOnToolConfirm = undefined;
});

describe("GoalSetupPanel", () => {
  it("renders the heading and subtitle", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    expect(screen.getByRole("heading", { name: /set your first goal/i })).toBeInTheDocument();
    expect(screen.getByText(/working toward/i)).toBeInTheDocument();
  });

  it("calls setHidden(true) on mount and setHidden(false) on unmount", () => {
    const { unmount } = render(
      <ChatDrawerProvider>
        <HiddenProbe />
        <GoalSetupPanel />
      </ChatDrawerProvider>
    );
    expect(screen.getByTestId("hidden").textContent).toBe("true");
    unmount();
    // After unmount the provider is gone too, but we've already asserted the
    // on-mount effect ran; the cleanup is exercised by the integration flow
    // via router.refresh which unmounts this panel.
  });

  it("calls router.refresh when onToolConfirm fires for set_primary_goal with approved=true", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    expect(lastOnToolConfirm).toBeDefined();
    act(() => { lastOnToolConfirm!("set_primary_goal", true); });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT call router.refresh when approved=false", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    act(() => { lastOnToolConfirm!("set_primary_goal", false); });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does NOT call router.refresh for other tool names", () => {
    render(<ChatDrawerProvider><GoalSetupPanel /></ChatDrawerProvider>);
    act(() => { lastOnToolConfirm!("add_subgoal", true); });
    act(() => { lastOnToolConfirm!("update_goal", true); });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/goal-setup-panel.test.tsx
```
Expected: FAIL — `Cannot find module '@/components/GoalSetupPanel'`.

- [ ] **Step 3: Create `components/GoalSetupPanel.tsx`**

```tsx
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
```

Notes:
- The exhaustive-deps disable is intentional: we want `setHidden(true)` to fire once on mount and the cleanup to fire on unmount. `drawer.setHidden` is stable across renders within the provider, so re-firing on every render would be harmless but unnecessary.
- The `min-h-[60vh]` wrapper gives the embedded chat enough height to feel like a primary surface, matching the EmptyGoalState's old `minHeight: "60vh"`.
- The `hairline` class is a project-specific Tailwind extension used throughout the dashboard for thin borders.

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run tests/goal-setup-panel.test.tsx
```
Expected: 5/5 PASS.

- [ ] **Step 5: Run full vitest**

```bash
npx vitest run
```
Expected: 40/40 PASS (35 previous + 5 new). Tsc clean (apart from the pre-existing api.test.ts:90 nit).

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add components/GoalSetupPanel.tsx tests/goal-setup-panel.test.tsx
git commit -m "feat(dashboard): GoalSetupPanel — embedded chat with set_primary_goal -> router.refresh (v4 followup: embedded goal chat T4)"
git push
```

---

## Task 5: Wire `/goals` to use `GoalSetupPanel` + delete `EmptyGoalState`

**Files:**
- Modify: `app/goals/page.tsx`
- Delete: `components/EmptyGoalState.tsx`
- Delete: `tests/goals.test.tsx`

- [ ] **Step 1: Swap the empty-state branch in `app/goals/page.tsx`**

Edit `app/goals/page.tsx`. Change the import block — remove the `EmptyGoalState` import and add a `GoalSetupPanel` import:

```diff
-import { EmptyGoalState } from "@/components/EmptyGoalState";
+import { GoalSetupPanel } from "@/components/GoalSetupPanel";
```

Inside `GoalsPage()`, change the `status.goal == null` branch from:

```tsx
  if (status.goal == null) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <EmptyGoalState />
      </main>
    );
  }
```

to:

```tsx
  if (status.goal == null) {
    return (
      <main className="max-w-6xl mx-auto px-6">
        <GoalSetupPanel />
      </main>
    );
  }
```

(The `py-8` is dropped because `GoalSetupPanel`'s own `py-8` provides vertical padding.)

- [ ] **Step 2: Delete `EmptyGoalState.tsx`**

```bash
git rm components/EmptyGoalState.tsx
```

- [ ] **Step 3: Delete `tests/goals.test.tsx`**

```bash
git rm tests/goals.test.tsx
```

(The single test it contained — `renders the CTA and openWith on click` — exercised `EmptyGoalState` directly. Its coverage is fully replaced by `goal-setup-panel.test.tsx` plus the updated Playwright spec in T6.)

- [ ] **Step 4: Verify no other imports of `EmptyGoalState`**

```bash
grep -rn "EmptyGoalState" app/ components/ tests/ lib/ 2>/dev/null
```
Expected: no matches. If anything matches, follow up and either delete or migrate the reference.

- [ ] **Step 5: Run vitest + typecheck**

```bash
npx vitest run
npx tsc --noEmit
```
Expected: 39/39 PASS (40 previous minus 1 deleted `goals.test.tsx`). Tsc clean.

- [ ] **Step 6: Commit**

```bash
git add app/goals/page.tsx components/EmptyGoalState.tsx tests/goals.test.tsx
git commit -m "feat(dashboard): /goals uses GoalSetupPanel; remove EmptyGoalState (v4 followup: embedded goal chat T5)"
git push
```

(Note: `git add` of deleted files records the deletion.)

---

## Task 6: Update Playwright e2e + local + prod verification

**Files:**
- Modify: `tests/e2e/v4.spec.ts`

- [ ] **Step 1: Replace the v4 spec contents**

Open `tests/e2e/v4.spec.ts` and replace the file with:

```typescript
import { test, expect } from "@playwright/test";

test.describe("v4 — goals page", () => {
  test("nav has Goals link", async ({ page }) => {
    await page.goto("/");
    const goalsLink = page.getByRole("link", { name: /Goals/i });
    await expect(goalsLink).toBeVisible();
  });

  test("/goals renders either empty (setup) state or active layout", async ({ page }) => {
    await page.goto("/goals");
    const empty = page.getByRole("heading", { name: /set your first goal/i });
    const active = page.getByText(/Today's recommendation/i);
    const emptyVisible = await empty.isVisible().catch(() => false);
    const activeVisible = await active.isVisible().catch(() => false);
    expect(emptyVisible || activeVisible).toBe(true);
  });

  test("empty state shows embedded chat with focused input and hides the right drawer", async ({ page }) => {
    await page.goto("/goals");
    const heading = page.getByRole("heading", { name: /set your first goal/i });
    const exists = await heading.isVisible().catch(() => false);
    if (!exists) test.skip(true, "active goal already exists in this environment");

    // Embedded chat input is present and focused
    const input = page.getByPlaceholder(/lose 15 lbs/i);
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Right-side drawer is NOT in the DOM
    // The drawer is the <aside> within the body's flex container; once
    // GoalSetupPanel mounts, drawer.hidden=true returns null and the aside
    // is removed entirely.
    const drawer = page.locator("aside").filter({ hasText: /chat/i });
    await expect(drawer).toHaveCount(0);
  });
});
```

Differences from the previous spec:
- Test 1 unchanged.
- Test 2's empty-state matcher is now `getByRole("heading", { name: /set your first goal/i })` instead of `getByText(/No active goal yet/i)`.
- Test 3 is wholly rewritten: it now asserts the embedded input is focused AND that the right drawer is absent from the DOM (`toHaveCount(0)` on the matching aside).

- [ ] **Step 2: Run Playwright locally**

```bash
cd ~/code/health-metrics-dashboard
npx playwright test tests/e2e/v4.spec.ts
```
Expected: 3/3 pass (or 2 pass + 1 skip if Hugo's local dev DB has an active goal). The previous T15 walkthrough may have left a goal in prod — the test config likely points at the local dev server though; check `playwright.config.ts` baseURL. If the test points at prod (`https://health.ironforgeai.com`) with Basic Auth, the active-state branch is the one that runs.

If the third test fails because the local backend's `/api/goals/status` returns an active goal, that's expected and the test will skip — confirm via the console output that "active goal already exists in this environment" appears.

- [ ] **Step 3: Run all Playwright specs to confirm no v2/v3 regressions**

```bash
npx playwright test
```
Expected: all specs pass. If `tests/e2e/v2.spec.ts` or `tests/e2e/v3.spec.ts` have assertions that depend on the right drawer being present on `/goals`, they will now fail (drawer is hidden on `/goals` empty state). The drawer is still present on `/` and `/workouts`. Spot-check the failures: if a test's intent was "drawer exists somewhere," update its assertion to `await page.goto("/")` first. If a test was explicitly testing `/goals` drawer behavior, the spec change is the intent — adjust narrowly.

- [ ] **Step 4: Run vitest one more time + tsc to confirm green**

```bash
npx vitest run
npx tsc --noEmit
```
Expected: 39/39 vitest + tsc clean.

- [ ] **Step 5: Commit + push**

```bash
git add tests/e2e/v4.spec.ts
git commit -m "test(e2e): v4 goals page asserts embedded setup chat + hidden drawer (v4 followup: embedded goal chat T6)"
git push
```

- [ ] **Step 6: Redeploy dashboard to Railway**

```bash
cd ~/code/health-metrics-dashboard
railway link --project 00a9fad2-f09b-43bb-bc6b-5d81436b6990 --environment production --service dashboard 2>&1 | tail -3
railway up --service dashboard --detach 2>&1 | tail -5
```
Note the deployment id. Poll until SUCCESS (template from v4 T7):

```bash
DEP_ID=<from the railway up output>
until STATUS=$(railway deployment list --service dashboard --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(next((x['status'] for x in d if x['id']=='$DEP_ID'), 'UNKNOWN'))") && [ "$STATUS" = "SUCCESS" -o "$STATUS" = "FAILED" -o "$STATUS" = "CRASHED" ]; do echo "$(date +%H:%M:%S) status=$STATUS"; sleep 20; done; echo "FINAL: $STATUS"
```

- [ ] **Step 7: Live verification on prod**

```bash
CREDS="hugo:$(cd ~/code/health-metrics-dashboard && railway variables --service dashboard --kv 2>/dev/null | grep '^DASHBOARD_PASSWORD=' | sed 's/^[^=]*=//')"
curl -sS -u "$CREDS" 'https://health.ironforgeai.com/goals' -o /tmp/goals.html -w "HTTP %{http_code}\n"
echo "--- markers ---"
echo -n "Set-your-first-goal heading: "; grep -c "Set your first goal" /tmp/goals.html
echo -n "Old empty-state marker (should be 0): "; grep -c "No active goal yet" /tmp/goals.html
echo -n "Embedded chat placeholder: "; grep -c "lose 15 lbs by August" /tmp/goals.html
```

Expected (if no active goal exists at the time):
- HTTP 200
- "Set your first goal" appears ≥ 1
- "No active goal yet" appears 0 (the old EmptyGoalState is dead)
- "lose 15 lbs by August" appears 1

If an active goal exists in prod (left over from T15 walkthrough), the page will render the active layout instead and the markers won't be present — that's fine; the empty-state behavior was verified by the local Playwright run in Step 2.

If you want to force the empty state for verification, run a one-off SQL update via the public proxy:
```bash
DB_URL=$(cd ~/code/health-metrics-service && railway variables --service Postgres --kv 2>/dev/null | grep '^DATABASE_PUBLIC_URL=' | sed 's/^[^=]*=//')
ASYNC_DB_URL=$(printf '%s' "$DB_URL" | sed 's|postgresql://|postgresql+asyncpg://|')
DATABASE_URL="$ASYNC_DB_URL" ~/code/health-metrics-service/.venv/bin/python3 -c "
import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
async def main():
    eng = create_async_engine(os.environ['DATABASE_URL'])
    async with eng.begin() as c:
        await c.execute(text(\"UPDATE goals SET status='archived' WHERE user_id='hugo' AND status='active'\"))
    await eng.dispose()
asyncio.run(main())
"
```
This archives any active goal and lets the page render the empty state for verification. After verifying, re-create the goal via the new chat panel as your T15-equivalent smoke.

- [ ] **Step 8: Tag the release (optional)**

Once the live verification passes, you can re-point the existing `v0.4.0-goals` tag or create a new patch tag like `v0.4.1-goals-embedded-chat`:

```bash
cd ~/code/health-metrics-dashboard
git tag -a v0.4.1-goals-embedded-chat -m "v4 followup: goal setup moved from drawer to embedded /goals chat panel"
git push --tags
```

(Skip if you'd prefer to bundle several v4 followups into one tag.)

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task |
|---|---|
| ChatPanel extraction with autoFocus / inputPlaceholder / onToolResult props | T3 (renamed onToolResult → onToolConfirm at plan-write time; the spec used onToolResult as a placeholder name but the semantics — fire after tool round-trip — are the same; only the name changed) |
| ChatDrawer becomes thin shell + `hidden` short-circuit | T3 (refactor) + T1 (`hidden`/`setHidden` on context) |
| GoalSetupPanel + h1 + subtitle + autoFocus + router.refresh | T4 |
| ChatDrawerContext gains `hidden`/`setHidden` | T1 |
| `app/goals/page.tsx` swap | T5 |
| Delete `EmptyGoalState.tsx` + `tests/goals.test.tsx` | T5 |
| Playwright spec update | T6 |
| Vitest tests for chat-panel + goal-setup-panel + chat-drawer-context.hidden | T3 + T4 + T1 |
| No backend changes / no new deps | Honored — none in any task |

**Note on prop naming:** the spec called the callback `onToolResult`. After re-reading `lib/chat.ts`, the natural insertion point is inside `confirmToolUse` AFTER the round-trip resolves — the parameter is the user's `approved` boolean, not a parsed tool-result payload. Renaming to `onToolConfirm` (parameter: `(toolName, approved)`) is more accurate and avoids implying we're parsing the server's tool result body. The behavior the spec described — `router.refresh()` only when `set_primary_goal` is approved — is unchanged.

**2. Placeholder scan:** No TBD / TODO / "implement later" strings. Every step has executable code or a precise diff. The only "open question" carry-forward is in the spec, not the plan.

**3. Type consistency:**
- `UseChatStreamOptions.onToolConfirm: (toolName: string, approved: boolean) => void` is the canonical signature, used identically in T2 (definition), T3 (ChatPanel prop), and T4 (GoalSetupPanel callback).
- `ChatPanelProps.onToolConfirm` matches the `UseChatStreamOptions` shape via `UseChatStreamOptions["onToolConfirm"]`.
- `ChatDrawerContextValue.hidden: boolean` / `setHidden: (hidden: boolean) => void` consistent in T1 definition and T4 consumption.

**4. Gaps fixed during review:**
- Originally I had the test in T1 inside the existing `Probe` component definition. Moved it into its own `HiddenProbe` to keep the two tests independent (the existing `Probe` doesn't expose `hidden`).
- T5 Step 3 originally suggested `git rm` for both files in one command. Kept it as two for clarity.

---

## Plan complete

Saved to `docs/superpowers/plans/2026-05-22-goal-setup-embedded-chat.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review (spec + quality), continuous execution.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch with checkpoints.

Which approach?
