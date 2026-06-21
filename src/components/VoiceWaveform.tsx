interface Props {
  active: boolean;
}

export function VoiceWaveform({ active }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 h-6 mt-4" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-amber-200/40 transition-all ${active ? 'wave-bar' : ''}`}
          style={{
            height: active ? undefined : '3px',
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
