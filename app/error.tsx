"use client";

import { useEffect } from "react";

export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="border border-accent-bad rounded p-6 bg-surface max-w-2xl">
      <div className="text-accent-bad font-mono text-sm uppercase tracking-wider">Error</div>
      <div className="mt-2 text-sm font-mono">{error.message}</div>
      <button
        onClick={reset}
        className="mt-4 px-3 py-1 border border-accent-primary text-accent-primary rounded text-sm hover:bg-accent-primary/10"
      >
        Retry
      </button>
    </div>
  );
}
