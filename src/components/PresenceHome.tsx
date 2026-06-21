import { PresenceOrb } from './PresenceShell';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'unsupported';

interface Props {
  displayName?: string;
  message: string;
  subtitle: string;
  voiceState: VoiceState;
  voiceSupported: boolean;
  onOrbPress: () => void;
  onBegin: () => void;
  beginLoading?: boolean;
  onOpenJourney: () => void;
  onLoadDemo: () => void;
  stackHint?: string;
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Tap the orb and tell me how you feel',
  listening: 'Listening…',
  thinking: 'Recalling your memories…',
  speaking: 'Presence is speaking',
  unsupported: 'Voice unavailable — use Agent panel',
};

export function PresenceHome({
  displayName,
  message,
  subtitle,
  voiceState,
  voiceSupported,
  onOrbPress,
  onBegin,
  beginLoading = false,
  onOpenJourney,
  onLoadDemo,
  stackHint,
}: Props) {
  const orbActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'thinking';

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <button
        type="button"
        onClick={onOrbPress}
        className={`relative rounded-full transition-transform duration-500 ${orbActive ? 'scale-110' : 'hover:scale-105'}`}
        aria-label="Talk to Presence"
      >
        <PresenceOrb />
        {voiceState === 'listening' && (
          <span className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
        )}
      </button>

      <p className="mt-3 text-xs text-white/45 tracking-wide">{STATE_LABEL[voiceState]}</p>

      <h1 className="mt-8 text-3xl md:text-[38px] font-light tracking-tight text-white/95 transition-opacity duration-700 max-w-lg leading-snug">
        {message}
      </h1>
      <p className="mt-4 text-lg md:text-[19px] text-white/65 font-light transition-opacity duration-700 max-w-md">
        {subtitle}
      </p>

      {stackHint && (
        <div className="mt-6 max-w-md rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 text-sm text-white/75 font-light">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Recommended now</p>
          {stackHint}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBegin}
          disabled={beginLoading}
          className="px-8 py-3 rounded-full bg-white/90 text-[#050505] text-sm font-medium hover:bg-white transition disabled:opacity-60"
        >
          {beginLoading ? 'Recalling your calm stack…' : 'Begin meditation'}
        </button>
        {voiceSupported && (
          <button
            type="button"
            onClick={onOrbPress}
            className="px-6 py-3 rounded-full border border-white/25 text-white/85 text-sm hover:bg-white/5"
          >
            {voiceState === 'listening' ? 'Listening…' : 'Speak to Presence'}
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-4 text-xs text-white/40">
        <button type="button" onClick={onOpenJourney} className="hover:text-white/70 hover:underline">
          30-day journey
        </button>
        <button type="button" onClick={onLoadDemo} className="hover:text-white/70 hover:underline">
          Load demo history
        </button>
      </div>

      {displayName && (
        <p className="mt-6 text-xs text-white/35 tracking-wide">Welcome back, {displayName}</p>
      )}
    </div>
  );
}
