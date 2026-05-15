export default function Loading() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="h-24 bg-surface border border-border rounded animate-pulse" />
      <div className="h-8 bg-surface border border-border rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface border border-border rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
