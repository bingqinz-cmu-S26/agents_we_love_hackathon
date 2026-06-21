import {
  JASON_HISTORY,
  JASON_INSIGHTS,
  MOOD_COLOR_STYLES,
  type MultimodalDayLog,
} from '../data/mockJasonHistory';
import { GlassCard } from './PresenceShell';
import { LIGHTING_OPTIONS, MUSIC_OPTIONS, SCENT_OPTIONS, GUIDE_OPTIONS } from '../types';

interface Props {
  logs?: MultimodalDayLog[];
  onSelectSession?: (log: MultimodalDayLog) => void;
}

export function JourneyPanel({ logs = JASON_HISTORY, onSelectSession }: Props) {
  const recent = [...logs].reverse().slice(0, 14);

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">Inner journey</p>
        <h2 className="text-2xl font-light tracking-tight text-white/95">Jason · 30 days</h2>
        <p className="text-sm text-white/55 mt-2 font-light">
          Multimodal log — mood, scent, sound, BPM, lighting, body signals
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {JASON_INSIGHTS.map((t) => (
            <span
              key={t}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.08] text-white/70 border border-white/[0.06]"
            >
              {t}
            </span>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
        {recent.map((log) => (
          <button
            key={log.id}
            type="button"
            onClick={() => onSelectSession?.(log)}
            className="w-full text-left"
          >
            <GlassCard className="p-4 hover:bg-white/[0.09] transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-white/45">{log.date}</span>
                <span className="text-xs text-white/50">{log.durationMin} min · {log.musicBpm} BPM</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${MOOD_COLOR_STYLES[log.preMoodColor]}`} />
                <span className="text-sm text-white/80 capitalize">{log.preEmotion.label}</span>
                <span className="text-white/30">→</span>
                <span className={`w-2.5 h-2.5 rounded-full ${MOOD_COLOR_STYLES[log.postMoodColor]}`} />
                <span className="text-sm text-white/90 capitalize">{log.postEmotion.label}</span>
                <span className="text-xs text-white/40 ml-auto">♥ {log.hrStart}→{log.hrEnd}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] text-white/55">
                <span className="chip">{log.deviceScent}</span>
                <span className="chip">{log.deviceSound}</span>
                <span className="chip">{LIGHTING_OPTIONS[log.stack.lighting]?.label}</span>
                <span className="chip">score {log.experienceScore.toFixed(2)}</span>
              </div>
              <p className="text-xs text-white/40 mt-2 font-light italic">{log.agentNote}</p>
            </GlassCard>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SessionDetailCard({ log }: { log: MultimodalDayLog }) {
  return (
    <GlassCard className="p-6">
      <p className="text-xs text-white/45">{log.date}</p>
      <h3 className="text-xl font-light mt-1">Session detail</h3>
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <p className="text-white/40 text-xs">Guide</p>
          <p>{GUIDE_OPTIONS[log.stack.guide]?.label}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Music</p>
          <p>{MUSIC_OPTIONS[log.stack.music]?.label}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Scent</p>
          <p>{SCENT_OPTIONS[log.stack.scent]?.label}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Lighting</p>
          <p>{LIGHTING_OPTIONS[log.stack.lighting]?.label}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Valence / Arousal</p>
          <p>{log.preValence.toFixed(1)} / {log.preArousal.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Body</p>
          <p>blink {log.eyeBlinkPerMin}/m · pitch Δ{log.voicePitchHz}Hz</p>
        </div>
      </div>
    </GlassCard>
  );
}
