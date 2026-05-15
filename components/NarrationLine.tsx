interface Props { narration: string | null; }

export function NarrationLine({ narration }: Props) {
  if (!narration) {
    return (
      <div className="border-l-2 border-text-muted pl-3 italic text-sm text-text-muted">
        Narration unavailable (no API key configured).
      </div>
    );
  }
  return (
    <div className="border-l-2 border-accent-primary pl-3 italic text-sm">
      {narration}
    </div>
  );
}
