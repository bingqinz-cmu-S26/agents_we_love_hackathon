import type { CalmStack, RecalledSession } from '../types';
import {
  GUIDE_OPTIONS,
  LIGHTING_OPTIONS,
  MUSIC_OPTIONS,
  SCENT_OPTIONS,
  stackLabel,
} from '../types';

export function recalledStackDetail(stack: CalmStack): string {
  return [
    GUIDE_OPTIONS[stack.guide]?.label ?? stack.guide,
    MUSIC_OPTIONS[stack.music]?.label ?? stack.music,
    SCENT_OPTIONS[stack.scent]?.label ?? stack.scent,
    LIGHTING_OPTIONS[stack.lighting]?.label ?? stack.lighting,
  ].join(', ');
}

export function RecalledSessionCard({
  session,
  compact,
}: {
  session: RecalledSession;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/15 bg-white/[0.06] ${compact ? 'p-2.5 text-[11px]' : 'p-3 text-xs'} text-white/70`}
    >
      <p className={`text-white/90 font-medium ${compact ? 'mb-0.5' : 'mb-1'}`}>
        📎 Recalled · {session.date}
      </p>
      <p>
        {session.preEmotion}
        {session.postEmotion ? ` → ${session.postEmotion}` : ''}
      </p>
      <p>{recalledStackDetail(session.stack)}</p>
      {session.hrStart != null && session.hrEnd != null && (
        <p>HR {session.hrStart} → {session.hrEnd}</p>
      )}
      {session.rating != null && <p>Rated {session.rating}/5</p>}
    </div>
  );
}

export function SessionRecalledPanel({ session }: { session: RecalledSession }) {
  return (
    <div className="session-glass p-5 w-full max-w-[220px]">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">From memory</p>
      <p className="text-xs text-white/30 font-light mt-1 mb-4">HydraDB recall</p>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Session</p>
          <p className="text-sm text-white/80 font-light">{session.date}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Shift</p>
          <p className="text-sm text-white/85 font-light">
            {session.preEmotion}
            {session.postEmotion ? ` → ${session.postEmotion}` : ''}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">What helped</p>
          <ul className="space-y-2 text-sm text-white/70 font-light">
            <li>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Guide</span>
              <br />
              {GUIDE_OPTIONS[session.stack.guide]?.label ?? session.stack.guide}
            </li>
            <li>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Sound</span>
              <br />
              {MUSIC_OPTIONS[session.stack.music]?.label ?? session.stack.music}
            </li>
            <li>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Scent</span>
              <br />
              {SCENT_OPTIONS[session.stack.scent]?.label ?? session.stack.scent}
            </li>
            <li>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Light</span>
              <br />
              {LIGHTING_OPTIONS[session.stack.lighting]?.label ?? session.stack.lighting}
            </li>
          </ul>
        </div>

        {(session.hrStart != null && session.hrEnd != null) || session.rating != null ? (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-1">Body</p>
            {session.hrStart != null && session.hrEnd != null && (
              <p className="text-sm text-white/75 font-light">
                HR {session.hrStart} → {session.hrEnd}
              </p>
            )}
            {session.rating != null && (
              <p className="text-sm text-white/55 font-light mt-1">Rated {session.rating}/5</p>
            )}
          </div>
        ) : null}

        <p className="text-[10px] text-white/30 leading-relaxed border-t border-white/10 pt-3">
          {stackLabel(session.stack)}
        </p>
      </div>
    </div>
  );
}
