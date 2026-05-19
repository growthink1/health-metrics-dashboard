"use client";

import { useCallback, useRef, useState } from "react";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  toolUse?: { id: string; name: string; input: Record<string, unknown> };
  toolResult?: { id: string; approved: boolean; result?: unknown };
}

export interface ToolUsePrompt {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface UseChatStreamReturn {
  messages: ChatMessage[];
  pendingToolUse: ToolUsePrompt | null;
  isStreaming: boolean;
  error: string | null;
  send: (text: string) => void;
  confirmToolUse: (approved: boolean) => void;
  cancel: () => void;
}

// Read tools auto-execute without prompting the user. Write tools (anything
// starting with `log_`) always require an inline Yes/No confirmation.
const READ_TOOL_NAMES = new Set(["get_recent_metrics", "get_workouts"]);

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingToolUse, setPendingToolUse] = useState<ToolUsePrompt | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runStream = useCallback(async (body: Record<string, unknown>, baseMessages: ChatMessage[]) => {
    setIsStreaming(true);
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;

    // Append an empty assistant placeholder we'll accumulate into
    const placeholder: ChatMessage = { role: "assistant", content: "" };
    setMessages([...baseMessages, placeholder]);

    let acc = "";
    let toolUse: ToolUsePrompt | null = null;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!resp.ok || !resp.body) {
        setError(`Chat failed: ${resp.status}`);
        setIsStreaming(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { value, done: eof } = await reader.read();
        if (eof) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          if (!chunk.startsWith("data:")) continue;
          let event;
          try {
            event = JSON.parse(chunk.slice(5).trim());
          } catch {
            continue;
          }
          if (event.type === "text") {
            acc += event.delta;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          } else if (event.type === "tool_use") {
            toolUse = { id: event.id, name: event.name, input: event.input };
            // Only PROMPT for write tools; read tools auto-confirm after the stream ends.
            if (!READ_TOOL_NAMES.has(toolUse.name)) {
              setPendingToolUse(toolUse);
            }
          } else if (event.type === "error") {
            setError(event.message);
          } else if (event.type === "done") {
            done = true;
            break;
          }
        }
      }

      // After the stream ends: if it ended on a READ tool_use, auto-confirm
      // and re-stream WITHOUT user interaction.
      if (toolUse !== null && READ_TOOL_NAMES.has(toolUse.name)) {
        const continued: ChatMessage[] = [
          ...baseMessages,
          { role: "assistant", content: acc, toolUse },
        ];
        setMessages(continued);
        // Recursive call — runStream sets isStreaming on entry and resets it
        // when it completes, so the caller's isStreaming stays true across
        // the read-tool round-trip.
        await runStream(
          {
            messages: continued.map(toApi),
            tool_confirmation: { id: toolUse.id, approved: true },
          },
          continued,
        );
        return;  // recursive runStream will reset isStreaming when done
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      // Only reset isStreaming if we're not in the middle of a recursive read-tool re-stream.
      // The recursive case returns early above, so reaching `finally` here means terminal.
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  // Track current messages in a ref so send() can read them without a
  // stale closure. Updated every render via the effect-free pattern of
  // assigning the ref immediately below useState.
  const messagesRef = useRef<ChatMessage[]>([]);

  const send = useCallback((text: string) => {
    const newMessages: ChatMessage[] = [...messagesRef.current, { role: "user", content: text }];
    messagesRef.current = newMessages;
    setMessages(newMessages);
    void runStream(
      { messages: newMessages.map(toApi) },
      newMessages,
    );
  }, [runStream]);

  const confirmToolUse = useCallback((approved: boolean) => {
    if (!pendingToolUse) return;
    const tu = pendingToolUse;
    setPendingToolUse(null);
    // Append the tool_use as part of the assistant turn, then trigger the
    // backend with tool_confirmation. Backend appends the tool_result.
    setMessages((prev) => {
      const continued: ChatMessage[] = [...prev];
      const lastIdx = continued.length - 1;
      if (lastIdx >= 0 && continued[lastIdx].role === "assistant") {
        continued[lastIdx] = { ...continued[lastIdx], toolUse: tu };
      }
      void runStream(
        {
          messages: continued.map(toApi),
          tool_confirmation: { id: tu.id, approved },
        },
        continued,
      );
      return continued;
    });
  }, [pendingToolUse, runStream]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, pendingToolUse, isStreaming, error, send, confirmToolUse, cancel };
}

function toApi(m: ChatMessage): { role: string; content: unknown } {
  if (m.toolUse) {
    return {
      role: "assistant",
      content: [
        ...(m.content ? [{ type: "text", text: m.content }] : []),
        { type: "tool_use", id: m.toolUse.id, name: m.toolUse.name, input: m.toolUse.input },
      ],
    };
  }
  return { role: m.role, content: m.content };
}
