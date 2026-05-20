"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Inline types for the Web Speech API — not in standard TS dom lib
interface SpeechRecognitionAlternativeLocal {
  readonly transcript: string;
}

interface SpeechRecognitionResultLocal {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLocal;
  [index: number]: SpeechRecognitionAlternativeLocal;
}

interface SpeechRecognitionResultListLocal {
  readonly length: number;
  item(index: number): SpeechRecognitionResultLocal;
  [index: number]: SpeechRecognitionResultLocal;
}

interface SpeechRecognitionEventLocal extends Event {
  readonly results: SpeechRecognitionResultListLocal;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLocal) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
}

interface UseVoiceInputReturn {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(opts: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const optsRef = useRef(opts);

  // Keep latest opts in a ref so start() always sees the current onTranscript
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* ignore */ }
    }
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: SpeechRecognitionEventLocal) => {
      const last = e.results[e.results.length - 1];
      if (!last) return;
      const transcript = last[0]?.transcript ?? "";
      if (transcript) optsRef.current.onTranscript?.(transcript.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}
