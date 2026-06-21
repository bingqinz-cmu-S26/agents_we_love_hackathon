import { useState } from 'react';
import { PresenceOrb } from './PresenceShell';

interface Props {
  onComplete: (spiritualTone: string, displayName?: string) => void;
  health?: { hydradb: boolean; nebius: boolean };
}

const TONES = [
  { id: 'gentle', label: 'Gentle & secular' },
  { id: 'spiritual', label: 'Spiritual & open' },
  { id: 'scientific', label: 'Science-forward' },
  { id: 'contemplative', label: 'Contemplative' },
];

export function Onboarding({ onComplete, health }: Props) {
  const [tone, setTone] = useState('spiritual');
  const [name, setName] = useState('Jason');

  return (
    <div className="presence-page min-h-screen flex items-center justify-center p-6 relative">
      <div className="presence-radial" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl p-8 text-center">
        <PresenceOrb size="md" />
        <h1 className="mt-8 text-3xl font-light tracking-tight">Presence</h1>
        <p className="text-white/55 mt-3 text-sm font-light leading-relaxed">
          Your meditation companion remembers how you feel, how your body responds, and what calms you —
          music, scent, lighting, and guide.
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full mt-8 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 outline-none focus:border-white/25 text-center"
        />

        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`px-4 py-2 rounded-full text-xs border ${
                tone === t.id ? 'bg-white text-black border-white' : 'border-white/20 text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onComplete(tone, name || undefined)}
          className="w-full mt-8 py-3 rounded-full bg-white text-black font-medium hover:opacity-90"
        >
          I&apos;m here
        </button>

        <p className="mt-6 text-[10px] text-white/35">
          HydraDB {health?.hydradb ? 'live' : 'local'} · Nebius {health?.nebius ? 'live' : 'fallback'}
        </p>
      </div>
    </div>
  );
}
