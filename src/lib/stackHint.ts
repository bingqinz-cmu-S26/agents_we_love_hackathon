import { GUIDE_OPTIONS, LIGHTING_OPTIONS, MUSIC_OPTIONS, SCENT_OPTIONS, stackLabel, type CalmStack } from '../types';

export function stackHintText(stack: CalmStack, fromMemory?: boolean, freshStart?: boolean): string {
  const prefix = fromMemory ? 'From memory —' : freshStart ? 'Starting fresh —' : 'For now —';
  return `${prefix} ${GUIDE_OPTIONS[stack.guide]?.label}, ${MUSIC_OPTIONS[stack.music]?.label}, ${SCENT_OPTIONS[stack.scent]?.label}, ${LIGHTING_OPTIONS[stack.lighting]?.label}.`;
}

export function stackHintShort(stack: CalmStack): string {
  return stackLabel(stack);
}
