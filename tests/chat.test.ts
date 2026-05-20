import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatStream } from "@/lib/chat";

function makeSseResponse(events: string[]) {
  // events is array of JSON strings; produce a Response with a streaming body
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(encoder.encode(`data: ${e}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

describe("useChatStream", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("accumulates text deltas into the last assistant message", async () => {
    globalThis.fetch = vi.fn(async () => makeSseResponse([
      JSON.stringify({ type: "text", delta: "Your HRV " }),
      JSON.stringify({ type: "text", delta: "is low." }),
      JSON.stringify({ type: "done" }),
    ])) as typeof fetch;

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      result.current.send("How am I?");
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("Your HRV is low.");
  });

  it("surfaces WRITE tool_use events as pendingToolUse", async () => {
    globalThis.fetch = vi.fn(async () => makeSseResponse([
      JSON.stringify({
        type: "tool_use",
        id: "toolu_abc",
        name: "log_weight",
        input: { date: "2026-05-17", weight_lbs: 218 },
      }),
      JSON.stringify({ type: "done" }),
    ])) as typeof fetch;

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      result.current.send("log my weight 218");
    });
    await waitFor(() => expect(result.current.pendingToolUse).not.toBeNull());

    expect(result.current.pendingToolUse?.name).toBe("log_weight");
    expect(result.current.pendingToolUse?.input).toEqual({ date: "2026-05-17", weight_lbs: 218 });
  });

  it("auto-confirms READ tool_use without showing pendingToolUse, re-fetches with tool_confirmation", async () => {
    const fetchSpy = vi.fn();
    // First call: stream a read tool_use
    fetchSpy.mockResolvedValueOnce(makeSseResponse([
      JSON.stringify({
        type: "tool_use", id: "toolu_read", name: "get_workouts", input: { days: 7 },
      }),
      JSON.stringify({ type: "done" }),
    ]));
    // Second call (auto-confirm): stream the resume text
    fetchSpy.mockResolvedValueOnce(makeSseResponse([
      JSON.stringify({ type: "text", delta: "Looked at workouts." }),
      JSON.stringify({ type: "done" }),
    ]));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      result.current.send("how many workouts this week?");
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.pendingToolUse).toBeNull();    // read tool did NOT pause for UI
    expect(fetchSpy).toHaveBeenCalledTimes(2);            // first stream + auto-confirm round-trip
    // Second fetch body should include tool_confirmation
    const secondBody = JSON.parse(fetchSpy.mock.calls[1][1]!.body as string);
    expect(secondBody.tool_confirmation).toEqual({ id: "toolu_read", approved: true });
  });

  it("send() with attachments builds a multimodal content array", async () => {
    const fetchSpy = vi.fn(async () =>
      makeSseResponse([JSON.stringify({ type: "done" })]),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      result.current.send("log this dinner", [
        { type: "image", mediaType: "image/jpeg", data: "BASE64" },
      ]);
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(fetchSpy).toHaveBeenCalledOnce();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = JSON.parse((fetchSpy.mock.calls as any)[0][1].body as string);
    expect(body.messages).toHaveLength(1);
    const content = body.messages[0].content;
    expect(Array.isArray(content)).toBe(true);
    expect(content[0]).toEqual({ type: "text", text: "log this dinner" });
    expect(content[1]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: "BASE64" },
    });
  });

  it("get_recent_meals is auto-confirmed (no pendingToolUse)", async () => {
    const fetchSpy = vi.fn();
    fetchSpy.mockResolvedValueOnce(makeSseResponse([
      JSON.stringify({ type: "tool_use", id: "toolu_x", name: "get_recent_meals", input: { days: 7 } }),
      JSON.stringify({ type: "done" }),
    ]));
    fetchSpy.mockResolvedValueOnce(makeSseResponse([
      JSON.stringify({ type: "text", delta: "Logged meals…" }),
      JSON.stringify({ type: "done" }),
    ]));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      result.current.send("what did I eat?");
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.pendingToolUse).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
