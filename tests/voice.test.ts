import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

interface MockEvent {
  results: { isFinal?: boolean; [index: number]: { transcript: string } }[];
}

class MockRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  onresult: ((e: MockEvent) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();

  static instances: MockRecognition[] = [];
  constructor() {
    MockRecognition.instances.push(this);
  }
}

beforeEach(() => {
  MockRecognition.instances = [];
  (globalThis as unknown as { webkitSpeechRecognition: typeof MockRecognition }).webkitSpeechRecognition = MockRecognition;
});
afterEach(() => {
  delete (globalThis as unknown as { webkitSpeechRecognition?: typeof MockRecognition }).webkitSpeechRecognition;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("useVoiceInput", () => {
  it("reports supported=true when SpeechRecognition exists", async () => {
    const { useVoiceInput } = await import("@/lib/voice");
    const { result } = renderHook(() => useVoiceInput());
    expect(result.current.supported).toBe(true);
  });

  it("start() begins recognition and onresult emits the transcript", async () => {
    const { useVoiceInput } = await import("@/lib/voice");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useVoiceInput({ onTranscript }));

    act(() => {
      result.current.start();
    });
    expect(result.current.listening).toBe(true);

    const rec = MockRecognition.instances.at(-1)!;
    expect(rec.start).toHaveBeenCalled();

    // Simulate the SpeechRecognition "result" event
    rec.onresult?.({
      results: [
        Object.assign([{ transcript: "log breakfast eggs and toast" }], { isFinal: true }),
      ],
    });
    expect(onTranscript).toHaveBeenCalledWith("log breakfast eggs and toast");
  });

  it("stop() calls recognition.stop() and clears listening", async () => {
    const { useVoiceInput } = await import("@/lib/voice");
    const { result } = renderHook(() => useVoiceInput());

    act(() => {
      result.current.start();
    });
    expect(result.current.listening).toBe(true);

    act(() => {
      result.current.stop();
    });
    const rec = MockRecognition.instances.at(-1)!;
    expect(rec.stop).toHaveBeenCalled();
    expect(result.current.listening).toBe(false);
  });

  it("supported=false when SpeechRecognition is absent", async () => {
    delete (globalThis as unknown as { webkitSpeechRecognition?: typeof MockRecognition }).webkitSpeechRecognition;
    vi.resetModules();
    const { useVoiceInput } = await import("@/lib/voice");
    const { result } = renderHook(() => useVoiceInput());
    expect(result.current.supported).toBe(false);
  });
});
