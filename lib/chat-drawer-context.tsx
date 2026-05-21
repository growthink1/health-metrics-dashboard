"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ChatDrawerContextValue {
  pendingInput: string | null;
  isOpen: boolean;
  consumePendingInput: () => string | null;
  openWith: (text: string) => void;
  setOpen: (open: boolean) => void;
}

const noop = () => undefined;

export const ChatDrawerContext = createContext<ChatDrawerContextValue>({
  pendingInput: null,
  isOpen: true,
  consumePendingInput: () => null,
  openWith: noop,
  setOpen: noop,
});

export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const [pendingInput, setPending] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

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
    <ChatDrawerContext.Provider
      value={{
        pendingInput,
        isOpen,
        openWith,
        setOpen: setIsOpen,
        consumePendingInput,
      }}
    >
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer() {
  return useContext(ChatDrawerContext);
}
