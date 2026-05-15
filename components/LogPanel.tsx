"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postManualLog } from "@/lib/api";

interface Props { logDate: string; logStatus: string; }

export function LogPanel({ logDate, logStatus }: Props) {
  const router = useRouter();
  const [energy, setEnergy] = useState("");
  const [mood, setMood] = useState("");
  const [hunger, setHunger] = useState("");
  const [weight, setWeight] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (logStatus === "complete") return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { user_id: "hugo", date: logDate };
      if (energy) payload.subjective_energy = Number(energy);
      if (mood) payload.subjective_mood = Number(mood);
      if (hunger) payload.subjective_hunger = Number(hunger);
      if (weight) payload.weight_lbs = Number(weight);
      await postManualLog(payload as unknown as Parameters<typeof postManualLog>[0]);
      router.refresh();
      setEnergy(""); setMood(""); setHunger(""); setWeight("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-border rounded p-4 bg-surface space-y-3">
      <div className="text-xs uppercase tracking-wider text-text-muted">
        Log today ({logStatus})
      </div>
      <div className="flex gap-3 flex-wrap items-end">
        <Field label="Energy (1-10)" value={energy} onChange={setEnergy} />
        <Field label="Mood (1-10)" value={mood} onChange={setMood} />
        <Field label="Hunger (1-10)" value={hunger} onChange={setHunger} />
        {showMore ? (
          <Field label="Weight (lbs)" value={weight} onChange={setWeight} step="0.1" />
        ) : (
          <button
            onClick={() => setShowMore(true)}
            className="text-xs text-accent-primary hover:underline self-end pb-2"
          >
            More: weight, kcal, macros →
          </button>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-2 border border-accent-primary text-accent-primary rounded font-mono text-sm hover:bg-accent-primary/10 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error ? <div className="text-xs text-accent-bad">{error}</div> : null}
    </div>
  );
}

function Field({
  label, value, onChange, step,
}: { label: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      <input
        type="number"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg border border-border rounded px-2 py-1 font-mono text-sm w-28 text-text"
      />
    </label>
  );
}
