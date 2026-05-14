export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatHours(min: number | null): string {
  if (min === null) return "—";
  return `${(min / 60).toFixed(1)}h`;
}

export function formatZ(z: number | null | undefined): string {
  if (z === null || z === undefined) return "";
  const arrow = z < 0 ? "↓" : z > 0 ? "↑" : "·";
  return `${arrow}${Math.abs(z).toFixed(1)}σ`;
}

export function recommendationLabel(rec: string): string {
  return rec.replace(/_/g, " ");
}
