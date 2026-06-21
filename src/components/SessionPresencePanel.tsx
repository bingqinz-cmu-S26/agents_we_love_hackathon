interface Props {
  whisper: string;
  clarity: number;
  minutesToday: number;
}

export function SessionPresencePanel({ whisper, clarity, minutesToday }: Props) {
  const companionState =
    clarity < 0.35 ? 'A quiet presence is forming.' : clarity < 0.7 ? 'Staying with you.' : 'Here, beside you.';

  return (
    <div className="w-full max-w-[220px] space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Presence</p>
        <p className="text-xs text-white/30 font-light mt-1">I'm here with you</p>
      </div>

      <div className="session-glass p-5 space-y-4">
        <p className="text-sm text-white/55 font-light leading-relaxed">
          {companionState}
        </p>

        <p className="text-sm text-white/75 font-light leading-relaxed italic border-l border-white/10 pl-3">
          {whisper}
        </p>

        <ul className="space-y-2 text-xs text-white/45 font-light">
          <li>You're allowed to simply arrive.</li>
          <li>Nothing needs to be fixed right now.</li>
        </ul>
      </div>

      <div className="session-glass p-4">
        <p className="text-[10px] text-white/35">Today</p>
        <p className="text-lg font-light text-white/80">{minutesToday} min</p>
        <div className="mt-3 h-8 flex items-end gap-1">
          {[0.3, 0.5, 0.4, 0.7, 0.6, 0.85, 0.5].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-cyan-200/20"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <p className="text-[10px] text-white/30 mt-2">Journey</p>
      </div>
    </div>
  );
}
