import type { CalmStack } from '../types';

export interface ExperienceItem {
  icon: string;
  title: string;
  category: string;
  tint: string;
}

export function stackToExperiences(stack: CalmStack): ExperienceItem[] {
  const sceneMap: Record<string, ExperienceItem> = {
    warm_glow: { icon: '☀', title: 'Warm Glow', category: 'Light', tint: 'text-amber-200/70' },
    candlelight: { icon: '🕯', title: 'Candlelight', category: 'Light', tint: 'text-amber-100/60' },
    dawn: { icon: '🌅', title: 'Dawn', category: 'Scene', tint: 'text-orange-200/50' },
    moonlight: { icon: '🌙', title: 'Moonlight', category: 'Scene', tint: 'text-cyan-200/50' },
    dark_room: { icon: '◐', title: 'Deep Silence', category: 'Scene', tint: 'text-white/40' },
  };

  const scentMap: Record<string, ExperienceItem> = {
    lavender: { icon: '🌿', title: 'Lavender', category: 'Scent', tint: 'text-violet-200/50' },
    sandalwood: { icon: '🪵', title: 'Sandalwood', category: 'Scent', tint: 'text-amber-100/50' },
    eucalyptus: { icon: '💧', title: 'Eucalyptus', category: 'Scent', tint: 'text-teal-200/50' },
    none: { icon: '○', title: 'Open Air', category: 'Scent', tint: 'text-white/35' },
  };

  const soundMap: Record<string, ExperienceItem> = {
    soft_piano: { icon: '〰', title: 'Soft Piano', category: 'Sound', tint: 'text-purple-200/50' },
    nature: { icon: '☁', title: 'Mountain Mist', category: 'Sound', tint: 'text-cyan-200/50' },
    '432hz': { icon: '◉', title: 'Sacred Tone', category: 'Sound', tint: 'text-cyan-100/50' },
    ambient_drone: { icon: '〰', title: 'Soft Rain', category: 'Sound', tint: 'text-blue-200/50' },
    silence: { icon: '·', title: 'Silence', category: 'Sound', tint: 'text-white/35' },
  };

  const guideMap: Record<string, ExperienceItem> = {
    '4-7-8': { icon: '～', title: 'Slow Breath', category: 'Guide', tint: 'text-cyan-100/45' },
    body_scan: { icon: '◎', title: 'Body Scan', category: 'Guide', tint: 'text-cyan-100/45' },
    box_breathing: { icon: '□', title: 'Steady Rhythm', category: 'Guide', tint: 'text-cyan-100/45' },
    loving_kindness: { icon: '♡', title: 'Warmth', category: 'Guide', tint: 'text-amber-100/45' },
  };

  return [
    sceneMap[stack.lighting] ?? sceneMap.warm_glow,
    scentMap[stack.scent] ?? scentMap.lavender,
    soundMap[stack.music] ?? soundMap.soft_piano,
    guideMap[stack.guide] ?? guideMap['4-7-8'],
  ];
}

export const WHISPER_LINES = [
  "I'm noticing… you're arriving.",
  'Your breathing is becoming softer.',
  'Your shoulders can let go now.',
  "Let's stay here a little longer.",
  'Nothing to achieve. Just this breath.',
  'The space is holding you.',
];
