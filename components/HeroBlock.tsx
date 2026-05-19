import type { TodayStripData } from "@/lib/types";

interface Props {
  data: TodayStripData;
  metricDate: string;
  recoveryScore: number | null; // 0-100; controls ring fill + color
}

function recoveryColor(score: number | null): string {
  if (score === null) return "var(--muted)";
  if (score < 33) return "var(--recovery-low)";
  if (score < 66) return "var(--recovery-mid)";
  return "var(--recovery-high)";
}

function RecoveryRing({ score, size = 148 }: { score: number | null; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = score === null ? c : c - (score / 100) * c;
  const color = recoveryColor(score);
  const display = score === null ? "—" : `${score}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#162033" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className="ringArc"
          style={{ ["--circ" as string]: String(c), ["--off" as string]: String(off), strokeDasharray: c } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[44px] font-extrabold leading-none tnum" style={{ color }}>
          {display}
        </div>
        <div className="font-mono text-[10px] tracked mt-1 text-muted">RECOVERY</div>
      </div>
      {/* Tick marks at 0/25/50/75% */}
      <svg className="absolute inset-0 pointer-events-none" width={size} height={size}>
        {[0, 25, 50, 75].map((p) => {
          const a = (p / 100) * 2 * Math.PI - Math.PI / 2;
          const x1 = size / 2 + Math.cos(a) * (r + stroke / 2 + 2);
          const y1 = size / 2 + Math.sin(a) * (r + stroke / 2 + 2);
          const x2 = size / 2 + Math.cos(a) * (r + stroke / 2 + 6);
          const y2 = size / 2 + Math.sin(a) * (r + stroke / 2 + 6);
          return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#243553" strokeWidth="1" />;
        })}
      </svg>
    </div>
  );
}

export function HeroBlock({ data, metricDate, recoveryScore }: Props) {
  const recommendation = data.recommendation.replace(/_/g, " ").toUpperCase();
  const critical = recoveryScore !== null && recoveryScore < 33;

  return (
    <section
      className="rounded-md hairline overflow-hidden relative dotgrid"
      style={{ background: "linear-gradient(180deg, var(--surface), var(--bg-2))" }}
    >
      <div className="absolute top-3 right-4 font-mono text-[10px] tracked flex items-center gap-3 text-muted-2">
        <span>BASELINE · 90d</span>
        <span className="text-muted">·</span>
        <span>{metricDate}</span>
      </div>
      <div className="absolute top-3 left-4 flex items-center gap-2">
        {critical ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: "var(--accent-bad)" }} />
            <span className="font-mono text-[10px] tracked" style={{ color: "var(--accent-bad)" }}>
              CRITICAL · ACTION REQUIRED
            </span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--muted)" }} />
            <span className="font-mono text-[10px] tracked text-muted">RECOMMENDATION</span>
          </>
        )}
      </div>
      <div className="px-7 pt-12 pb-6 flex items-center gap-8">
        <RecoveryRing score={recoveryScore} />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[11px] tracked mb-2 text-muted">TODAY&apos;S RECOMMENDATION</div>
          <h1
            className="font-black leading-[0.85] tracking-tight"
            style={{ fontSize: 96, letterSpacing: "-0.04em", color: "var(--text)" }}
          >
            {recommendation}
          </h1>
          {data.suggested_training_mod ? (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {data.suggested_training_mod.split(",").map((piece, i) => (
                <span
                  key={i}
                  className="font-mono text-[12px] px-2.5 py-1 rounded-sm"
                  style={{
                    background: i === 0 ? "rgba(226,90,74,0.12)" : i === 1 ? "rgba(126,181,224,0.10)" : "rgba(90,212,168,0.10)",
                    color: i === 0 ? "var(--accent-bad)" : i === 1 ? "var(--accent-primary)" : "var(--accent-good)",
                  }}
                >
                  {piece.trim().toUpperCase()}
                </span>
              ))}
            </div>
          ) : null}
          {data.suggested_kcal !== null ? (
            <div className="mt-2 font-mono text-[11px] text-muted-2">
              TARGET <span style={{ color: "var(--text)" }}>{data.suggested_kcal.toLocaleString()} kcal</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
