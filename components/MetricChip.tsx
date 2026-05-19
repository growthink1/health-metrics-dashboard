interface Props {
  label: string;
  value: string;
  unit?: string;
  color: "primary" | "warm" | "good" | "bad" | "strain" | "weight";
  sub?: string;
}

const COLOR_VARS: Record<Props["color"], string> = {
  primary: "var(--accent-primary)",
  warm: "var(--accent-warm)",
  good: "var(--accent-good)",
  bad: "var(--accent-bad)",
  strain: "var(--accent-strain)",
  weight: "var(--accent-weight)",
};

export function MetricChip({ label, value, unit, color, sub }: Props) {
  const c = COLOR_VARS[color];
  return (
    <div
      className="flex items-center gap-3 px-4 h-11 rounded-md hairline"
      style={{ background: "var(--surface)" }}
    >
      <span className="block w-1.5 h-5 rounded-sm" style={{ background: c }} />
      <span className="font-mono text-[10px] tracked text-muted">{label}</span>
      <span className="text-[17px] font-semibold tnum" style={{ color: "var(--text)" }}>
        {value}
        {unit ? <span className="font-mono text-[11px] ml-0.5 text-muted">{unit}</span> : null}
      </span>
      {sub ? <span className="font-mono text-[10px] ml-1 text-muted-2">{sub}</span> : null}
    </div>
  );
}
