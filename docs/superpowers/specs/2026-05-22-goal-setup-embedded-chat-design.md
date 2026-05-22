# Embedded goal-setup chat — design spec

**Date:** 2026-05-22
**Repo:** `growthink1/health-metrics-dashboard`
**Origin:** UAT feedback from v4 goals: the "Help me set my first goal" CTA routes the user to the right-side chat drawer, but the goal-setting interaction should occur in the main screen area.

## Goal

Move the goal-setup interview (Q1–Q5 + `set_primary_goal` + `add_subgoal` tool calls) out of the right-side chat drawer and into the main content area of `/goals` when no active goal exists. The interaction stays conversational — same backend (`/api/chat` + interview addendum in `chat_prompts.py` + 4 chat tools shipped in v4 T5/T6) — only the **mount point** changes.

After the goal is created, the embedded panel disappears, `/goals` renders the existing active layout, and the right-side drawer returns for follow-up questions.

## Non-goals

- **No backend changes.** `/api/chat` already injects the interview addendum when no active goal exists. Same endpoint serves the embedded panel and the drawer.
- **No goal-coach "always-on" embedded chat.** Once a goal exists, the chat-on-/goals surface disappears (we picked Option 1 of "panel lifecycle" during brainstorming). The right drawer is the way to continue chatting about the goal.
- **No form-wizard.** The brainstorm rejected Option B (structured radio/input wizard) and Option C (hybrid form + Claude assist) in favor of pure conversational discovery.
- **No quick-pick tiles.** The brainstorm picked Option α (pure chat) over Option β (4 goal-type tiles above the chat). Header + subtitle + chat input is the entire empty-state surface.
- **No chat-history persistence.** The embedded panel keeps its own local message history. Once the goal is created and the panel unmounts, the Q1–Q5 conversation is lost. This matches the project's existing pattern (chat is client-side per session; persistent history was already flagged as a v5 carry-forward).

## Architecture

### Component decomposition

| Component | Purpose | Notes |
|---|---|---|
| `components/ChatPanel.tsx` (new) | Pure chat UI: messages list, streaming, input + send button, tool-use confirm cards, image attachment, mic. Generic — knows nothing about drawer or page placement. | Extracted from today's `ChatDrawer.tsx`. Becomes the single source of truth for the chat UI. |
| `components/ChatDrawer.tsx` (modified) | Thin shell around `ChatPanel`: right-side sidebar chrome (collapse button, width, sticky positioning). Renders `null` when `ChatDrawerContext.hidden === true`. | All chat logic moves to `ChatPanel`. The drawer's only remaining job is the wrapper layout. |
| `components/GoalSetupPanel.tsx` (new) | The embedded surface on `/goals` empty state: h1 + 1-line subtitle + `<ChatPanel onToolResult={...} />`. On mount calls `drawer.setHidden(true)`; on unmount calls `setHidden(false)`. | Knows about the chat-drawer context. Wires `set_primary_goal` success to `router.refresh()`. |
| `components/EmptyGoalState.tsx` (deleted) | Old empty state with the CTA button. | Dead code after this change. |
| `lib/chat-drawer-context.tsx` (modified) | Add `hidden: boolean` + `setHidden(v: boolean)` to the context value + provider. | Backward compatible: defaults to `hidden = false`. |
| `app/goals/page.tsx` (modified) | Swap `<EmptyGoalState />` → `<GoalSetupPanel />` in the `status.goal == null` branch. | Otherwise unchanged. |
| `tests/goals.test.tsx` (deleted) | Only exercised `EmptyGoalState`. | Replaced by the two new component tests below. |
| `tests/chat-panel.test.tsx` (new) | Basic mount, input typing, `onToolResult` callback invocation. | Mock the `/api/chat` fetch — no live SSE. |
| `tests/goal-setup-panel.test.tsx` (new) | Mounts inside `ChatDrawerProvider`, asserts `setHidden(true)` was called, asserts `router.refresh()` is called on `set_primary_goal` ok. | Mock `next/navigation` for `useRouter`. |
| `tests/e2e/v4.spec.ts` (modified) | Replace the existing "empty state CTA opens chat drawer pre-filled" test with one that asserts (a) the embedded chat input is visible on `/goals` empty state, (b) the right-side drawer is NOT present on `/goals` empty state, (c) the nav `Goals` link still works. | Other two tests in this file unchanged. |

### Data flow

```
┌─────────────────────────────────────────────────────────┐
│ /goals (server component)                               │
│  └─ fetchGoalStatus("hugo")                             │
│       │                                                  │
│       ├─ goal == null                                    │
│       │    └─ <GoalSetupPanel />                         │
│       │         ├─ useEffect: setHidden(true) on mount   │
│       │         │             setHidden(false) on unmount│
│       │         ├─ h1 "Set your first goal"              │
│       │         ├─ subtitle                              │
│       │         └─ <ChatPanel                            │
│       │              onToolResult={(name, r) => {        │
│       │                if (name === "set_primary_goal"   │
│       │                    && r.ok) router.refresh();    │
│       │              }}                                  │
│       │            />                                    │
│       │                                                  │
│       └─ goal != null                                    │
│            └─ existing layout (header / chart / etc)     │
│                                                          │
│  <ChatDrawer />                                          │
│    └─ if (drawer.hidden) return null;                    │
│       <aside> ... <ChatPanel /> ... </aside>             │
└─────────────────────────────────────────────────────────┘
```

### `ChatDrawerContext` extended shape

```ts
interface ChatDrawerContextValue {
  // existing
  pendingInput: string | null;
  isOpen: boolean;
  consumePendingInput: () => string | null;
  openWith: (text: string) => void;
  setOpen: (open: boolean) => void;
  // new
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}
```

`hidden` defaults to `false`. `ChatDrawer` short-circuits to `return null` when `hidden === true`.

### `ChatPanel` contract

```ts
interface ChatPanelProps {
  // Optional callback fired when a tool returns. Used by GoalSetupPanel
  // to react to set_primary_goal success.
  onToolResult?: (toolName: string, result: { ok: boolean; result?: unknown; error?: string }) => void;
  // Optional initial focus on mount. Default false in the drawer (to avoid
  // stealing focus from page content); GoalSetupPanel sets it to true.
  autoFocus?: boolean;
  // Optional placeholder text for the input. Default "Ask Claude…"
  inputPlaceholder?: string;
}
```

No new fetch/streaming logic — `ChatPanel` reuses every existing `fetch("/api/chat", ...)` and tool-use confirmation flow that `ChatDrawer` has today. The only new wiring is the `onToolResult` callback firing **after** the tool's confirmation has been server-acknowledged and the result returned.

### `GoalSetupPanel` contract

No external props.

```tsx
"use client";
export function GoalSetupPanel() {
  const drawer = useChatDrawer();
  const router = useRouter();

  useEffect(() => {
    drawer.setHidden(true);
    return () => drawer.setHidden(false);
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Set your first goal
        </h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Tell me what you're working toward and I'll walk you through it.
        </p>
      </header>
      <ChatPanel
        autoFocus
        inputPlaceholder="e.g. lose 15 lbs by August"
        onToolResult={(name, r) => {
          if (name === "set_primary_goal" && r.ok) {
            router.refresh();
          }
        }}
      />
    </div>
  );
}
```

`router.refresh()` triggers a server component re-fetch (`fetchGoalStatus`) without a full client navigation. The new goal is found, the page swaps to the active layout, `GoalSetupPanel` unmounts, `setHidden(false)` fires, drawer reappears.

## Behavior flow

1. User navigates to `/goals` with no active goal.
2. Server component fetches `/api/goals/status?user_id=hugo` → returns `{goal: null, ...}`.
3. Page renders `<GoalSetupPanel />`. Right drawer becomes hidden.
4. User reads the prompt, types "I want to lose 15 lbs by August" in the input, hits enter.
5. `ChatPanel` POSTs to `/api/chat` with the user message. Backend `build_system_prompt` finds no active goal, appends the `_INTERVIEW_ADDENDUM` to the system prompt.
6. Claude responds with Q1 (or jumps to Q2 if the goal type is already clear). Stream renders inline.
7. Conversation continues through Q2/Q3/Q4. User can interrupt or redirect freely.
8. At Q5, Claude calls `set_primary_goal` with the proposed args. Tool-use card appears in `ChatPanel`. User clicks **Confirm**.
9. Server executes `set_primary_goal`, returns `{ok: true, result: {goal_id, name, start_value}}` (or `{ok: true, result: {..., warning: "initial_recompute_failed"}}` if recompute crashed — handled gracefully).
10. `ChatPanel` fires `onToolResult("set_primary_goal", {ok: true, ...})`. `GoalSetupPanel` calls `router.refresh()`.
11. Server component re-fetches `/api/goals/status`, now returns the new goal.
12. Page re-renders with `GoalHeader` / `GoalTrajectoryChart` / `GoalStatRow` / `MilestoneList` / `SubgoalList` / `RecommendationCard`.
13. `GoalSetupPanel` unmounts → `setHidden(false)` fires → right drawer reappears (collapsed or open per the user's last drawer state — we don't force-open).
14. Subsequent `add_subgoal` calls happen in the right drawer (Claude continues the conversation from the existing session if the user keeps chatting). The right drawer's `ChatPanel` is a fresh instance with its own local message history — this is acceptable because once a goal exists, the user can simply ask "add a subgoal for 2100 kcal" and Claude has the goal context from `chat_prompts.py`'s active-goal block.

### Edge cases

- **User abandons setup mid-conversation, refreshes the page.** `GoalSetupPanel` remounts (still no goal), the chat panel starts with empty message history. The Q1–Q5 progress is lost. Acceptable per non-goal "no chat-history persistence."
- **User asks an unrelated question during setup** (e.g., "what was my HRV yesterday?"). `chat_prompts.py` still seeds the system prompt with recent metrics and the 30-day compact history, so Claude can answer. The interview addendum is also still present, so Claude will gently steer back to goal setup at the next opportunity. No code change needed.
- **`set_primary_goal` returns `{ok: false}`** (e.g., past target_date). `onToolResult` fires with `ok: false`. `GoalSetupPanel` does nothing (no refresh). The chat panel renders Claude's follow-up explanation. User retries.
- **Tool-use confirmation card never confirmed** (user closes the page before clicking confirm). The goal is never created. Refreshing brings back the empty state. Same as today.

## Test plan

### Unit tests (vitest)

1. **`tests/chat-panel.test.tsx`** (replaces existing chat-drawer test coverage)
   - Renders with default placeholder; renders with custom `inputPlaceholder`.
   - Typing into the input updates state.
   - `autoFocus` prop focuses the input on mount.
   - Mocked `/api/chat` fetch — verify a user message gets posted and Claude response streams render.
   - `onToolResult` callback fires after a mocked tool response with `{ok: true}`.

2. **`tests/goal-setup-panel.test.tsx`**
   - Mounts inside `ChatDrawerProvider`. On mount, the provider's `hidden` flag becomes `true`. On unmount, it becomes `false`.
   - Renders the h1 + subtitle text.
   - Mocks `next/navigation`'s `useRouter` — when `onToolResult` is called with `("set_primary_goal", {ok: true, ...})`, `router.refresh` is invoked.
   - `onToolResult("set_primary_goal", {ok: false, error: "..."})` does NOT call `router.refresh`.
   - `onToolResult("add_subgoal", {ok: true})` does NOT call `router.refresh` (only `set_primary_goal` triggers it).

3. **`tests/chat-drawer-context.test.tsx`** (existing, update)
   - Add a test: `setHidden(true)` updates `hidden` to `true`. Drawer rendered inside the provider returns `null` when `hidden === true`.

### Playwright (`tests/e2e/v4.spec.ts`)

Update the existing 3-test spec:

- **"nav has Goals link"** — unchanged.
- **"/goals renders either empty state OR active layout"** — update the empty-state matcher: instead of looking for "No active goal yet", look for the new h1 "Set your first goal" + the embedded chat input placeholder.
- **"empty state shows embedded chat and hides drawer"** (rewritten from the old "CTA opens chat drawer pre-filled" test) — on `/goals` empty state, assert:
  - The h1 "Set your first goal" is visible
  - An input with placeholder matching `/e.g. lose 15 lbs/i` is visible AND focused
  - The right-side drawer element (current selector: the drawer's `<aside>` or whatever class targets it) is NOT in the DOM (or has `display:none`)

If the existing v2 / v3 specs depended on the drawer being mounted on every page, audit and adjust. (Spot-check during implementation; the drawer is still mounted on `/` and `/workouts` — only suppressed on `/goals` when empty.)

## Open questions / followups

- **Drawer suppression is page-state-driven, not route-driven.** If a user manually navigates from `/goals` empty → `/` → `/goals` empty, the cleanup runs correctly. The risk is a future page also using `setHidden` and the cleanup races — for v4.1 we have only one consumer (`GoalSetupPanel`), so this isn't an issue yet. v5 should formalize "hidden owner" semantics if a second consumer appears.
- **Chat input autofocus interaction with `ChatDrawerContext.pendingInput`.** `ChatPanel` already has the existing pendingInput-prefill effect (from T9). When `GoalSetupPanel` mounts, `pendingInput` is whatever it was before (likely `null` or a stale value from a prior session). The autoFocus + pendingInput effects both run; if `pendingInput` is non-null it gets consumed into the input. This is acceptable — it's the same behavior as today.
- **No metrics on adoption** of the new flow. Not in v4.1 scope; we'll learn from the next session-by-session smoke.

## Scope summary

- 2 new components (`ChatPanel`, `GoalSetupPanel`)
- 2 modified components (`ChatDrawer` becomes a thin shell, `ChatDrawerContext` gains `hidden`/`setHidden`)
- 1 modified page (`app/goals/page.tsx`)
- 1 deleted component + 1 deleted test (`EmptyGoalState.tsx`, `tests/goals.test.tsx`)
- 2 new unit tests
- 1 updated chat-drawer-context test
- 1 updated Playwright spec
- 0 backend changes
- 0 schema/migration changes
- 0 new dependencies

Estimated effort: small single-session refactor. Largest unit is the `ChatPanel` extraction from `ChatDrawer.tsx` (~250 lines moving + 1–2 hours of getting the existing v2/v3 Playwright suite back to green if any chrome assumptions broke).
