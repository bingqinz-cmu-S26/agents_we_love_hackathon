import { useMemo } from 'react';
import { buildMeditationSilhouette } from '../lib/meditationSilhouette';

interface Props {
  /** 0 = faint companion forming, 1 = fully present */
  clarity: number;
  breathPhase: number;
}

export function ParticleCompanion({ clarity, breathPhase }: Props) {
  const particles = useMemo(() => buildMeditationSilhouette(), []);

  const scale = 0.94 + breathPhase * 0.08;
  const opacity = 0.55 + clarity * 0.45;
  const chestGlow = 0.45 + clarity * 0.5;

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-[3/4] min-h-[460px] flex items-center justify-center">
      {/* Large soft halo behind figure */}
      <div
        className="absolute left-1/2 top-[36%] w-[130%] h-[80%] rounded-full blur-3xl pointer-events-none transition-all duration-[6000ms] ease-in-out"
        style={{
          background: `radial-gradient(circle, rgba(255,175,90,${0.18 + clarity * 0.14}) 0%, rgba(120,200,240,0.06) 38%, transparent 68%)`,
          transform: `translate(-50%, -50%) scale(${1 + breathPhase * 0.07})`,
        }}
      />

      {/* Body underglow — helps silhouette read even at low clarity */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
        style={{ opacity: 0.18 + clarity * 0.22, filter: 'blur(2px)' }}
      >
        <defs>
          <radialGradient id="bodyUnderglow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#ffb347" stopOpacity="1" />
            <stop offset="45%" stopColor="#c8ecff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#05050a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="14" rx="12" ry="14" fill="url(#bodyUnderglow)" />
        <ellipse cx="50" cy="36" rx="26" ry="24" fill="url(#bodyUnderglow)" />
        <ellipse cx="38" cy="70" rx="19" ry="12" fill="url(#bodyUnderglow)" />
        <ellipse cx="62" cy="71" rx="19" ry="12" fill="url(#bodyUnderglow)" />
        <ellipse cx="50" cy="84" rx="22" ry="9" fill="url(#bodyUnderglow)" />
      </svg>

      {/* Heart warmth — emotional center */}
      <div
        className="absolute left-1/2 top-[40%] w-36 h-36 rounded-full blur-2xl pointer-events-none transition-all duration-[6000ms]"
        style={{
          background: `radial-gradient(circle, rgba(255,140,60,${chestGlow}) 0%, rgba(255,110,40,0.2) 40%, transparent 70%)`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      />

      {/* Particle figure */}
      <div
        className="relative w-full h-full transition-all duration-[8000ms] ease-out"
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {particles.map((p) => {
          const layerClass =
            p.layer === 'wisp'
              ? 'bg-cyan-50/70 companion-wisp'
              : p.layer === 'outline'
                ? 'bg-white/90 companion-outline'
                : 'bg-cyan-100/90 companion-particle';

          const layerOpacity =
            p.layer === 'wisp'
              ? 0.35 + clarity * 0.5
              : p.layer === 'outline'
                ? 0.55 + clarity * 0.45
                : 0.45 + clarity * 0.55;

          return (
            <span
              key={p.id}
              className={`absolute rounded-full ${layerClass}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                opacity: layerOpacity,
                marginLeft: `${-p.size / 2}px`,
                marginTop: `${-p.size / 2}px`,
                ['--drift-x' as string]: `${p.driftX * 14}px`,
              }}
            />
          );
        })}

        {/* Ground fog — lower body dissolves into mist */}
        <div
          className="absolute bottom-0 left-[-12%] right-[-12%] h-[45%] pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #05050a 0%, #05050a 30%, rgba(5,5,10,0.9) 50%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}
