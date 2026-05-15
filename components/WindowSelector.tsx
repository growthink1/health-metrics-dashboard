"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS = [7, 14, 30, 90] as const;

export function WindowSelector({ defaultDays = 14 }: { defaultDays?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Number(params.get("days") ?? defaultDays);

  function set(days: number) {
    const next = new URLSearchParams(params);
    next.set("days", String(days));
    router.push(`${pathname}?${next}`);
  }

  return (
    <div className="flex gap-1 font-mono text-xs">
      {OPTIONS.map((d) => (
        <button
          key={d}
          onClick={() => set(d)}
          className={`px-2 py-1 border rounded ${
            d === current
              ? "border-accent-primary text-accent-primary"
              : "border-border text-text-muted hover:border-accent-primary"
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}
