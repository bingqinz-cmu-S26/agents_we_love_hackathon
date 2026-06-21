import type { CalmStack } from '../types';
import { GUIDE_OPTIONS, LIGHTING_OPTIONS, MUSIC_OPTIONS, SCENT_OPTIONS } from '../types';

export function CalmStackPreview({ stack }: { stack: CalmStack }) {
  return (
    <ul className="space-y-2 text-sm text-white/75 font-light">
      <li>🧘 {GUIDE_OPTIONS[stack.guide]?.label ?? stack.guide}</li>
      <li>
        {MUSIC_OPTIONS[stack.music]?.emoji} {MUSIC_OPTIONS[stack.music]?.label ?? stack.music}
      </li>
      <li>
        {SCENT_OPTIONS[stack.scent]?.emoji} {SCENT_OPTIONS[stack.scent]?.label ?? stack.scent}
      </li>
      <li>💡 {LIGHTING_OPTIONS[stack.lighting]?.label ?? stack.lighting}</li>
    </ul>
  );
}
