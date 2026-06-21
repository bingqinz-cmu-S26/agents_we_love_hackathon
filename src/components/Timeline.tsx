import type { SessionRecord } from '../types';
import { MUSIC_OPTIONS, SCENT_OPTIONS } from '../types';

interface Props {
  sessions: SessionRecord[];
}

export function Timeline({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-still-border bg-still-surface p-4 text-sm text-slate-400">
        Session timeline will appear here after your first meditation.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-still-border bg-still-surface p-4">
      <h3 className="font-medium mb-3 text-sm">Emotion arcs</h3>
      <div className="space-y-3">
        {sessions.slice(0, 8).map((s) => (
          <div key={s.id} className="text-xs border-b border-still-border/50 pb-3 last:border-0">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>{s.date}</span>
              {s.rating && <span>{'★'.repeat(s.rating)}</span>}
            </div>
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <span className="capitalize">{s.preEmotion.label}</span>
              <span className="text-slate-500">→</span>
              <span className="capitalize text-still-accent">{s.postEmotion?.label ?? '?'}</span>
            </div>
            <div className="text-slate-500 flex flex-wrap gap-2">
              {s.hrStart && s.hrEnd && <span>♥ {Math.round(s.hrStart)}→{Math.round(s.hrEnd)}</span>}
              <span>{MUSIC_OPTIONS[s.stack.music]?.emoji}</span>
              <span>{SCENT_OPTIONS[s.stack.scent]?.emoji}</span>
              <span>💡</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
