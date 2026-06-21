import { EMOTIONS, type EmotionCheckIn } from '../types';

export function emotionCheckInFromLabel(label: string): EmotionCheckIn {
  const normalized = label.toLowerCase().trim();
  const word = EMOTIONS.find((e) => e.label === normalized);
  return {
    label: word?.label ?? normalized,
    quadrant: word?.quadrant ?? 'green',
    energy: word?.energy ?? 0.5,
    pleasantness: word?.pleasantness ?? 0.5,
    phase: 'pre',
    timestamp: new Date().toISOString(),
  };
}
