import { useEffect, useState } from 'react';
import type { AppState, EmotionCheckIn } from '../types';
import { unlockSessionAudio } from '../lib/sessionAudio';
import { stackToExperiences, WHISPER_LINES } from '../lib/sessionExperiences';
import { useSilentVitals } from '../hooks/useSilentVitals';
import { ParticleCompanion } from './ParticleCompanion';
import { SessionEnvironmentPanel } from './SessionEnvironmentPanel';
import { SessionPresencePanel } from './SessionPresencePanel';
import { RecalledSessionCard, SessionRecalledPanel } from './RecalledSessionDisplay';
import { VoiceWaveform } from './VoiceWaveform';
import { MoodMeter } from './MoodMeter';
import { useSessionAmbience } from '../hooks/useSessionAmbience';
import { SessionElapsedTimer } from './SessionElapsedTimer';

interface Props {
  session: NonNullable<AppState['activeSession']>;
  minutesToday?: number;
  onComplete: (data: {
    postEmotion: EmotionCheckIn;
    hrStart?: number;
    hrEnd?: number;
    rating: number;
    userNote?: string;
    durationSec: number;
  }) => void;
  onExit: () => void;
}

export function SessionView({ session, minutesToday = 32, onComplete, onExit }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<'active' | 'debrief'>('active');
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [breathPhase, setBreathPhase] = useState(0);

  const recalled = session.recalledSession;
  const experiences = recalled ? [] : stackToExperiences(session.stack);
  const { hrStart, hrEnd, hrSamples } = useSilentVitals(phase === 'active');
  const { ambience, muted, playing, blocked, loading, toggleMute, retryPlay } = useSessionAmbience(
    session.stack.music,
    phase === 'active',
  );

  const clarity = Math.min(1, seconds / 90);

  useEffect(() => {
    if (phase !== 'active') return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active') return;
    const whisperTimer = setInterval(() => {
      setWhisperIndex((i) => (i + 1) % WHISPER_LINES.length);
    }, 14000);
    return () => clearInterval(whisperTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active') return;
    const breathTimer = setInterval(() => {
      setBreathPhase((p) => (p >= 1 ? 0 : p + 0.05));
    }, 300);
    return () => clearInterval(breathTimer);
  }, [phase]);

  const whisper = WHISPER_LINES[whisperIndex];
  const centerLine = seconds < 30 ? "Let's stay here." : whisper.replace(/^I'm noticing… /, '');

  if (phase === 'debrief') {
    const hrS = hrStart ?? hrSamples[0];
    const hrE = hrEnd ?? (hrSamples.length ? hrSamples[hrSamples.length - 1] : undefined);

    return (
      <div className="session-space min-h-screen flex items-center justify-center p-6 glass-overlay">
        <div className="session-glass w-full max-w-md p-8">
          <SessionElapsedTimer seconds={seconds} variant="debrief" />
          <p className="text-xs text-white/40 text-center">{new Date().toLocaleDateString()}</p>
          <h2 className="text-2xl font-light mt-2 text-white/95">Inner journey</h2>
          <p className="text-sm text-white/55 font-light mt-2">
            {hrS && hrE
              ? 'Your body settled — quietly, without needing to watch it.'
              : 'How does your body feel now?'}
          </p>
          <MoodMeter
            phase="post"
            onSelect={(emotion) => {
              onComplete({
                postEmotion: emotion,
                hrStart: hrS,
                hrEnd: hrE,
                rating,
                userNote: note || undefined,
                durationSec: seconds,
              });
            }}
          />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`w-9 h-9 rounded-full text-sm ${rating >= n ? 'bg-amber-200/90 text-black' : 'border border-white/20 text-white/50'}`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — a word about this moment"
            rows={2}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 placeholder:text-white/30 font-light resize-none focus:outline-none focus:border-white/20"
          />
          <p className="mt-5 text-sm italic text-white/60 font-light text-center">
            Quiet became your progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-space min-h-screen relative overflow-hidden text-white">
      {/* Ambient drift */}
      <div className="session-ambient" />

      <button
        type="button"
        onClick={onExit}
        className="absolute top-5 left-5 z-20 text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50"
      >
        leave quietly
      </button>

      <button
        type="button"
        onClick={() => setPhase('debrief')}
        className="absolute top-5 right-5 z-20 text-[10px] uppercase tracking-widest text-white/35 hover:text-white/60 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25"
      >
        finish
      </button>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 px-4 py-16 max-w-6xl mx-auto">
        <div className="hidden lg:block shrink-0">
          {recalled ? (
            <SessionRecalledPanel session={recalled} />
          ) : (
            <SessionEnvironmentPanel items={experiences} />
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[62vh] py-4">
          <ParticleCompanion clarity={clarity} breathPhase={breathPhase} />

          <h1 className="mt-8 text-2xl md:text-3xl font-light tracking-tight text-white/90 text-center max-w-md">
            {seconds < 45 ? "Let's stay here." : centerLine}
          </h1>

          <VoiceWaveform active={seconds > 0} />
        </div>

        <div className="hidden lg:block shrink-0">
          <SessionPresencePanel whisper={whisper} clarity={clarity} minutesToday={minutesToday} />
        </div>
      </div>

      {/* Center-bottom elapsed timer */}
      <div className="fixed bottom-[5.5rem] lg:bottom-16 left-1/2 -translate-x-1/2 z-20">
        <SessionElapsedTimer seconds={seconds} />
      </div>

      {/* Mobile: recalled memory or environment chips */}
      <div className="lg:hidden fixed bottom-28 left-4 right-4 z-10">
        {recalled ? (
          <RecalledSessionCard session={recalled} compact />
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {experiences.map((e) => (
              <span key={e.title} className="session-chip text-[10px] text-white/50 px-3 py-1">
                {e.icon} {e.title}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 session-breath-bar" aria-hidden />

      {ambience && phase === 'active' && (
        <div className="fixed bottom-6 right-5 z-20 flex flex-col items-end gap-2">
          {blocked && !muted && (
            <button
              type="button"
              onClick={() => {
                unlockSessionAudio();
                retryPlay();
              }}
            className="text-[10px] uppercase tracking-widest text-amber-200/60 hover:text-amber-200/90 px-3 py-1 rounded-full border border-amber-200/20 bg-black/40"
          >
            tap for sound
          </button>
          )}
          <button
            type="button"
            onClick={toggleMute}
            className="text-[10px] uppercase tracking-widest text-white/25 hover:text-white/50 flex items-center gap-1.5"
            aria-label={muted ? 'Unmute ocean sound' : 'Mute ocean sound'}
          >
            <span>{muted ? 'sound off' : loading ? 'loading…' : playing ? 'ocean' : blocked ? 'tap above' : 'sound…'}</span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-200/50"
              style={{ opacity: muted ? 0.2 : playing ? 0.9 : 0.4 }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
