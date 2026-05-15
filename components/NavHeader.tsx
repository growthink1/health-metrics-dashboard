import Link from "next/link";

export function NavHeader() {
  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-surface">
      <div className="font-mono text-lg text-accent-primary">health-metrics</div>
      <nav className="flex gap-6 text-sm">
        <Link href="/" className="text-text-muted hover:text-text">Grid</Link>
        <Link href="/workouts" className="text-text-muted hover:text-text">Workouts</Link>
        <span className="text-text-muted opacity-40 cursor-not-allowed">Settings</span>
      </nav>
    </header>
  );
}
