import type { CalmStack, EmotionCheckIn, Quadrant, SessionRecord } from '../types';
import { formatSessionMemory, formatUserProfileMemory } from '../types';

export const DEMO_PERSON = {
  userId: 'USER_JASON_001',
  name: 'Jason',
  spiritualTone: 'spiritual',
};

/** Bump when regenerating HydraDB seed data */
export const JASON_MOCK_VERSION = 2;

export type MoodColor = 'Red' | 'Blue' | 'Green' | 'Yellow';

export interface MultimodalDayLog {
  id: string;
  date: string;
  userId: string;
  preMoodColor: MoodColor;
  postMoodColor: MoodColor;
  preValence: number;
  preArousal: number;
  durationMin: number;
  eyeBlinkPerMin: number;
  voicePitchHz: number;
  deviceScent: string;
  deviceSound: string;
  musicBpm: number;
  lighting: string;
  scentReactionScore: number;
  soundReactionScore: number;
  experienceScore: number;
  hrStart: number;
  hrEnd: number;
  stack: CalmStack;
  preEmotion: EmotionCheckIn;
  postEmotion: EmotionCheckIn;
  agentNote: string;
  preContext?: string;
}

export interface JasonMemoryItem {
  sourceId: string;
  text: string;
  infer?: boolean;
}

const MOOD_META: Record<
  MoodColor,
  { quadrant: Quadrant; preLabel: string; postLabel: string; valence: number; arousal: number }
> = {
  Red: { quadrant: 'red', preLabel: 'anxious', postLabel: 'peaceful', valence: -0.6, arousal: 0.7 },
  Blue: { quadrant: 'blue', preLabel: 'tired', postLabel: 'content', valence: -0.5, arousal: -0.5 },
  Green: { quadrant: 'green', preLabel: 'calm', postLabel: 'peaceful', valence: 0.7, arousal: -0.6 },
  Yellow: { quadrant: 'yellow', preLabel: 'hopeful', postLabel: 'grateful', valence: 0.8, arousal: 0.6 },
};

const SCENTS = ['Lavender', 'Sandalwood', 'Cedarwood', 'Citrus', 'Peppermint'];
const SOUNDS = [
  'Deep Tibetan Bowl',
  'Rain on Tent',
  'White Noise Ambient',
  'Lo-Fi Healing Alpha',
  'Forest Birds',
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mapScent(name: string): CalmStack['scent'] {
  const m: Record<string, CalmStack['scent']> = {
    Lavender: 'lavender',
    Sandalwood: 'sandalwood',
    Cedarwood: 'eucalyptus',
    Citrus: 'none',
    Peppermint: 'eucalyptus',
  };
  return m[name] ?? 'lavender';
}

function mapSound(name: string): CalmStack['music'] {
  const m: Record<string, CalmStack['music']> = {
    'Deep Tibetan Bowl': '432hz',
    'Rain on Tent': 'nature',
    'White Noise Ambient': 'ambient_drone',
    'Lo-Fi Healing Alpha': 'soft_piano',
    'Forest Birds': 'nature',
  };
  return m[name] ?? 'soft_piano';
}

function mapGuide(color: MoodColor): CalmStack['guide'] {
  if (color === 'Red') return '4-7-8';
  if (color === 'Blue') return 'body_scan';
  if (color === 'Green') return 'loving_kindness';
  return 'box_breathing';
}

function mapLighting(color: MoodColor): CalmStack['lighting'] {
  if (color === 'Red') return 'warm_glow';
  if (color === 'Blue') return 'dawn';
  if (color === 'Green') return 'candlelight';
  return 'moonlight';
}

function emotionFrom(color: MoodColor, phase: 'pre' | 'post', date: string, note?: string): EmotionCheckIn {
  const meta = MOOD_META[color];
  const label = phase === 'pre' ? meta.preLabel : meta.postLabel;
  return {
    label,
    quadrant: meta.quadrant,
    energy: Math.abs(meta.arousal),
    pleasantness: (meta.valence + 1) / 2,
    phase,
    timestamp: date,
    note,
  };
}

function pickScent(rand: () => number, mood: MoodColor): string {
  if (mood === 'Red') {
    if (rand() < 0.72) return 'Sandalwood';
    if (rand() < 0.5) return 'Lavender';
    return SCENTS[Math.floor(rand() * SCENTS.length)];
  }
  if (rand() < 0.12) return 'Citrus';
  return SCENTS[Math.floor(rand() * SCENTS.length)];
}

function pickSound(rand: () => number, mood: MoodColor): string {
  if (mood === 'Red' && rand() < 0.65) return 'Deep Tibetan Bowl';
  if (mood === 'Blue' && rand() < 0.4) return 'Rain on Tent';
  return SOUNDS[Math.floor(rand() * SOUNDS.length)];
}

function preContextForDay(dateStr: string, mood: MoodColor, rand: () => number): string | undefined {
  const day = new Date(dateStr).getDay();
  if (mood === 'Red' && day >= 1 && day <= 5) {
    const triggers = [
      'big meeting tomorrow',
      'deadline pressure',
      'morning commute stress',
      'work inbox overload',
    ];
    return triggers[Math.floor(rand() * triggers.length)];
  }
  if (mood === 'Blue' && rand() < 0.5) return 'poor sleep last night';
  return undefined;
}

export interface JasonHistoryOptions {
  days?: number;
  seed?: number;
  startDate?: string;
}

export function generateJasonHistory(options: JasonHistoryOptions = {}): MultimodalDayLog[] {
  const { days = 30, seed = 2026, startDate = '2026-05-22' } = options;
  const rand = seededRand(seed);
  const start = new Date(startDate);
  let currentColor: MoodColor = 'Red';
  const logs: MultimodalDayLog[] = [];

  for (let day = 0; day < days; day++) {
    const d = new Date(start);
    d.setDate(start.getDate() + day);
    const dateStr = d.toISOString().slice(0, 10);
    const dateDisplay = `${dateStr} ${String(9 + Math.floor(rand() * 3)).padStart(2, '0')}:00`;

    const highActivation = currentColor === 'Red' || currentColor === 'Yellow';
    const durationMin = highActivation
      ? 6 + Math.floor(rand() * 10)
      : 12 + Math.floor(rand() * 18);
    const eyeBlink = highActivation ? 8 + rand() * 10 : 1 + rand() * 3;
    const voicePitch = highActivation ? 10 + rand() * 15 : 1 + rand() * 7;

    const selectedScent = pickScent(rand, currentColor);
    const selectedSound = pickSound(rand, currentColor);
    const recommendedBpm =
      MOOD_META[currentColor].arousal < 0
        ? 50 + Math.floor(rand() * 21)
        : 68 + Math.floor(rand() * 24);

    let scentScore =
      selectedScent === 'Sandalwood'
        ? 0.78 + rand() * 0.2
        : selectedScent === 'Citrus'
          ? -0.45 + rand() * 0.35
          : -0.2 + rand() * 0.85;
    let soundScore =
      selectedSound === 'Deep Tibetan Bowl'
        ? 0.85 + rand() * 0.12
        : -0.15 + rand() * 0.88;
    const experienceScore = Math.round(((scentScore + soundScore) / 2) * 100) / 100;
    scentScore = Math.round(scentScore * 100) / 100;
    soundScore = Math.round(soundScore * 100) / 100;

    let postColor: MoodColor = currentColor;
    if (experienceScore > 0.45) postColor = rand() > 0.45 ? 'Green' : 'Yellow';
    else if (experienceScore < -0.05) postColor = rand() > 0.5 ? 'Red' : 'Blue';

    const hrStart = highActivation ? 80 + Math.floor(rand() * 14) : 66 + Math.floor(rand() * 12);
    const hrDrop = Math.floor(6 + experienceScore * 24 + rand() * 10);
    const hrEnd = Math.max(56, hrStart - hrDrop);

    const stack: CalmStack = {
      guide: mapGuide(currentColor),
      music: mapSound(selectedSound),
      scent: mapScent(selectedScent),
      lighting: mapLighting(currentColor),
    };

    const preContext = preContextForDay(dateStr, currentColor, rand);
    const preEmotion = emotionFrom(
      currentColor,
      'pre',
      dateStr,
      preContext ? `context: ${preContext}` : undefined,
    );
    const postEmotion = emotionFrom(postColor, 'post', dateStr);

    const preLabel = MOOD_META[currentColor].preLabel;
    const postLabel = MOOD_META[postColor].postLabel;
    const hrPct = Math.round(((hrStart - hrEnd) / hrStart) * 100);

    const agentNote =
      experienceScore > 0.6
        ? `Strong session: ${preLabel} → ${postLabel}, HR −${hrPct}%. ${selectedScent} + ${selectedSound} worked well.`
        : experienceScore < 0
          ? `Mismatched session: ${selectedScent} felt off. ${preLabel} lingered — try different scent.`
          : `Gradual settle: ${preLabel} softened toward ${postLabel} over ${durationMin} min.`;

    logs.push({
      id: `jason_v${JASON_MOCK_VERSION}_${dateStr}`,
      date: dateDisplay,
      userId: DEMO_PERSON.userId,
      preMoodColor: currentColor,
      postMoodColor: postColor,
      preValence: MOOD_META[currentColor].valence,
      preArousal: MOOD_META[currentColor].arousal,
      durationMin,
      eyeBlinkPerMin: Math.round(eyeBlink * 10) / 10,
      voicePitchHz: Math.round(voicePitch * 10) / 10,
      deviceScent: selectedScent,
      deviceSound: selectedSound,
      musicBpm: recommendedBpm,
      lighting: stack.lighting,
      scentReactionScore: scentScore,
      soundReactionScore: soundScore,
      experienceScore,
      hrStart,
      hrEnd,
      stack,
      preEmotion,
      postEmotion,
      agentNote,
      preContext,
    });

    if (experienceScore > 0.45) currentColor = rand() > 0.5 ? 'Green' : 'Yellow';
    else if (experienceScore < -0.05) currentColor = rand() > 0.5 ? 'Red' : 'Blue';
  }

  return logs;
}

export const JASON_HISTORY = generateJasonHistory();

export function multimodalToSessionRecord(log: MultimodalDayLog): SessionRecord {
  const rating =
    log.experienceScore > 0.6 ? 5 : log.experienceScore > 0.2 ? 4 : log.experienceScore > -0.1 ? 3 : 2;
  return {
    id: log.id,
    date: log.date,
    preEmotion: log.preEmotion,
    postEmotion: log.postEmotion,
    stack: log.stack,
    hrStart: log.hrStart,
    hrEnd: log.hrEnd,
    calmScore: Math.round(((log.hrStart - log.hrEnd) / log.hrStart) * 100),
    rating,
    userNote: log.agentNote,
    outcome: rating >= 4 ? 'effective' : rating >= 3 ? 'partial' : 'ineffective',
    durationSec: log.durationMin * 60,
  };
}

export function jasonSessionExtras(log: MultimodalDayLog) {
  return {
    durationMin: log.durationMin,
    deviceScent: log.deviceScent,
    deviceSound: log.deviceSound,
    musicBpm: log.musicBpm,
    scentReactionScore: log.scentReactionScore,
    soundReactionScore: log.soundReactionScore,
    experienceScore: log.experienceScore,
    eyeBlinkPerMin: log.eyeBlinkPerMin,
    voicePitchHz: log.voicePitchHz,
    preMoodColor: log.preMoodColor,
    postMoodColor: log.postMoodColor,
  };
}

export function jasonSessionTimeline(): SessionRecord[] {
  return JASON_HISTORY.map(multimodalToSessionRecord).reverse();
}

export function jasonMemoryItems(): JasonMemoryItem[] {
  const profile = formatUserProfileMemory({
    displayName: DEMO_PERSON.name,
    userId: DEMO_PERSON.userId,
    spiritualTone: DEMO_PERSON.spiritualTone,
    notes: [
      `Mock dataset v${JASON_MOCK_VERSION} — 30-day meditation journey.`,
      'Strong positive reaction to Sandalwood scent and Deep Tibetan Bowl sound.',
      'Warm_glow lighting helps when anxious (Red quadrant).',
      'Dislikes mismatched citrus sessions.',
    ],
  });

  const patterns: JasonMemoryItem[] = [
    {
      sourceId: `jason_v${JASON_MOCK_VERSION}_pattern_red_stack`,
      text: 'Pattern: When Jason checks in Red (anxious), 4-7-8 + 432hz/nature + sandalwood + warm_glow yields HR drops of 18-28%.',
      infer: true,
    },
    {
      sourceId: `jason_v${JASON_MOCK_VERSION}_pattern_blue_tired`,
      text: 'Pattern: When Blue (tired), body scan + dawn lighting + rain sounds helps Jason feel content.',
      infer: true,
    },
    {
      sourceId: `jason_v${JASON_MOCK_VERSION}_pattern_best_pair`,
      text: 'Pattern: Best experience scores when Sandalwood + Deep Tibetan Bowl are paired — avoid Citrus when anxious.',
      infer: true,
    },
  ];

  const sessions: JasonMemoryItem[] = JASON_HISTORY.map((log) => {
    const session = multimodalToSessionRecord(log);
    return {
      sourceId: log.id,
      text: formatSessionMemory(session, jasonSessionExtras(log)),
      infer: false,
    };
  });

  return [
    {
      sourceId: `jason_v${JASON_MOCK_VERSION}_profile`,
      text: profile,
      infer: true,
    },
    ...patterns,
    ...sessions,
  ];
}

export function jasonMemoryTexts(): string[] {
  return jasonMemoryItems().map((item) => item.text);
}

export const JASON_INSIGHTS = [
  'Jason often starts anxious (Red) before work-heavy mornings',
  'Best stack: 4-7-8 · Sandalwood · Deep Tibetan Bowl · Warm glow (avg HR −22%)',
  'Citrus sessions score negative — sandalwood + bowl score 0.85+',
  '30-day arc: Red → Green as memory-guided stacks improved',
  'Warm glow when anxious; dawn + rain when tired (Blue)',
];

export const MOOD_COLOR_STYLES: Record<MoodColor, string> = {
  Red: 'bg-mood-red/80',
  Blue: 'bg-mood-blue/80',
  Green: 'bg-mood-green/80',
  Yellow: 'bg-mood-yellow/80',
};
