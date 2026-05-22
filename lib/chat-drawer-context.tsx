"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ChatDrawerContextValue {
  pendingInput: string | null;
  isOpen: boolean;
  hidden: boolean;
  consumePendingInput: () => string | null;
  openWith: (text: string) => void;
  setOpen: (open: boolean) => void;
  setHidden: (hidden: boolean) => void;
}

const noop = () => undefined;

export const ChatDrawerContext = createContext<ChatDrawerContextValue>({
  pendingInput: null,
  isOpen: true,
  hidden: false,
  consumePendingInput: () => null,
  openWith: noop,
  setOpen: noop,
  setHidden: noop,
});

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
    <ChatDrawerContext.Provider
      value={{
        pendingInput,
        isOpen,
        hidden,
        openWith,
        setOpen: setIsOpen,
        setHidden,
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
