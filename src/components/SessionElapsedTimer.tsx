import { formatElapsed } from '../lib/formatElapsed';

interface Props {
  seconds: number;
  variant?: 'session' | 'debrief';
}

export function SessionElapsedTimer({ seconds, variant = 'session' }: Props) {
  const label = formatElapsed(seconds);

  if (variant === 'debrief') {
    return (
      <div className="text-center mb-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">You stayed</p>
        <p className="text-3xl font-light tabular-nums text-white/90 mt-1">{label}</p>
      </div>
    );
  }

  return (
    <div
      className="session-timer flex flex-col items-center justify-center px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md"
      aria-live="polite"
      aria-label={`Elapsed time ${label}`}
    >
      <span className="text-[9px] uppercase tracking-[0.35em] text-white/30 mb-0.5">here</span>
      <span className="text-xl md:text-2xl font-light tabular-nums tracking-wide text-white/75 leading-none">
        {label}
      </span>
    </div>
  );
}
