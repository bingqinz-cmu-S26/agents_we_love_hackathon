import type { EmotionCheckIn } from '../types';
import { EMOTIONS, type Quadrant } from '../types';

const QUADRANT_META: Record<
  Quadrant,
  { label: string; bg: string; border: string; subtitle: string }
> = {
  red: { label: 'High energy · Unpleasant', bg: 'bg-mood-red/10', border: 'border-mood-red/40', subtitle: 'Red quadrant' },
  blue: { label: 'Low energy · Unpleasant', bg: 'bg-mood-blue/10', border: 'border-mood-blue/40', subtitle: 'Blue quadrant' },
  yellow: { label: 'High energy · Pleasant', bg: 'bg-mood-yellow/10', border: 'border-mood-yellow/40', subtitle: 'Yellow quadrant' },
  green: { label: 'Low energy · Pleasant', bg: 'bg-mood-green/10', border: 'border-mood-green/40', subtitle: 'Green quadrant' },
};

interface Props {
  onSelect: (emotion: EmotionCheckIn) => void;
  phase: 'pre' | 'post';
}

export function MoodMeter({ onSelect, phase }: Props) {
  const quadrants: Quadrant[] = ['red', 'blue', 'yellow', 'green'];

  return (
    <div className="rounded-2xl border border-still-border bg-still-surface p-4">
      <div className="mb-4">
        <h3 className="font-medium text-slate-200">Mood Meter</h3>
        <p className="text-xs text-slate-400">Inspired by How We Feel — pick the word that fits best</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {quadrants.map((q) => {
          const meta = QUADRANT_META[q];
          const words = EMOTIONS.filter((e) => e.quadrant === q);
          return (
            <div key={q} className={`rounded-xl border p-3 ${meta.bg} ${meta.border}`}>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{meta.subtitle}</p>
              <p className="text-xs text-slate-300 mb-2">{meta.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {words.map((e) => (
                  <button
                    key={e.label}
                    onClick={() =>
                      onSelect({
                        ...e,
                        phase,
                        timestamp: new Date().toISOString(),
                      })
                    }
                    className="px-2.5 py-1 rounded-full text-xs bg-still-bg/60 border border-white/10 hover:border-white/30 capitalize"
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
