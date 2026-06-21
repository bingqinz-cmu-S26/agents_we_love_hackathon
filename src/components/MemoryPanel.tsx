import type { MemoryInsight, SessionRecord } from '../types';
import { GUIDE_OPTIONS, LIGHTING_OPTIONS, MUSIC_OPTIONS, SCENT_OPTIONS } from '../types';

interface Props {
  insights: MemoryInsight[];
  forgetMode: boolean;
  timeline: SessionRecord[];
}

export function MemoryPanel({ insights, forgetMode, timeline }: Props) {
  const derivedInsights: string[] = [];

  if (timeline.length > 0) {
    const best = timeline.find((s) => (s.rating ?? 0) >= 4);
    if (best) {
      derivedInsights.push(
        `Best calm stack: ${GUIDE_OPTIONS[best.stack.guide]?.label}, ${MUSIC_OPTIONS[best.stack.music]?.label}, ${SCENT_OPTIONS[best.stack.scent]?.label}, ${LIGHTING_OPTIONS[best.stack.lighting]?.label}${best.hrStart && best.hrEnd ? ` (HR ${Math.round(best.hrStart)}→${Math.round(best.hrEnd)})` : ''}`,
      );
    }
    const anxiousSessions = timeline.filter((s) => s.preEmotion.label === 'anxious');
    if (anxiousSessions.length >= 2) {
      derivedInsights.push('You often check in as anxious before sessions');
    }
  }

  const allInsights = [...derivedInsights, ...insights.map((i) => i.text)].slice(0, 6);

  return (
    <div className="rounded-2xl border border-still-accent/30 bg-gradient-to-br from-still-surface to-still-bg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🧠</span>
        <div>
          <h2 className="font-medium text-still-accent">Presence Remembers</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
            {forgetMode ? 'Forget mode — memory hidden' : 'Recalled from HydraDB'}
          </p>
        </div>
      </div>

      {allInsights.length === 0 ? (
        <p className="text-sm text-slate-400">
          Complete your first session — I'll remember your emotions, calm stack, and body response.
        </p>
      ) : (
        <ul className="space-y-2">
          {allInsights.map((text, i) => (
            <li key={i} className="text-sm text-slate-300 flex gap-2">
              <span className="text-still-accent shrink-0">•</span>
              <span className="line-clamp-3">{text.slice(0, 180)}{text.length > 180 ? '…' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
