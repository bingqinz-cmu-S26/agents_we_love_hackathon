import type { ExperienceItem } from '../lib/sessionExperiences';

export function SessionEnvironmentPanel({ items }: { items: ExperienceItem[] }) {
  return (
    <div className="session-glass p-5 w-full max-w-[200px]">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Environment</p>
      <p className="text-xs text-white/30 font-light mt-1 mb-5">Crafted for you</p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span className={`text-lg ${item.tint} opacity-70`}>{item.icon}</span>
            <div>
              <p className="text-sm text-white/85 font-light tracking-wide">{item.title}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">{item.category}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
