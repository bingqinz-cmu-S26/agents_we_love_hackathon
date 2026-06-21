import type { CalmStack } from '../types';

/** Default calm stack for first-time users with no HydraDB history */
export const FRESH_START_STACK: CalmStack = {
  guide: '4-7-8',
  music: 'soft_piano',
  scent: 'lavender',
  lighting: 'warm_glow',
};

export const FRESH_START_MESSAGES = {
  title: "Let's begin where you are.",
  subtitle: 'No history needed — tap Begin meditation for a gentle first session.',
  stackLabel: 'Starting fresh',
};
