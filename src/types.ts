export type Quadrant = 'red' | 'blue' | 'yellow' | 'green';

export interface EmotionWord {
  label: string;
  quadrant: Quadrant;
  energy: number;
  pleasantness: number;
}

export interface EmotionCheckIn {
  label: string;
  quadrant: Quadrant;
  energy: number;
  pleasantness: number;
  phase: 'pre' | 'post';
  timestamp: string;
  note?: string;
}

export interface CalmStack {
  guide: string;
  music: string;
  scent: string;
  lighting: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  preEmotion: EmotionCheckIn;
  postEmotion?: EmotionCheckIn;
  stack: CalmStack;
  hrStart?: number;
  hrEnd?: number;
  calmScore?: number;
  rating?: number;
  userNote?: string;
  outcome?: 'effective' | 'partial' | 'ineffective';
  /** Wall-clock meditation duration */
  durationSec?: number;
}

export interface SessionMemoryExtras {
  durationMin?: number;
  deviceScent?: string;
  deviceSound?: string;
  musicBpm?: number;
  scentReactionScore?: number;
  soundReactionScore?: number;
  experienceScore?: number;
  eyeBlinkPerMin?: number;
  voicePitchHz?: number;
  preMoodColor?: string;
  postMoodColor?: string;
}

export interface RecalledSession {
  date: string;
  preEmotion: string;
  postEmotion?: string;
  stack: CalmStack;
  hrStart?: number;
  hrEnd?: number;
  rating?: number;
}

export interface MemoryInsight {
  text: string;
  source?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  recalledFrom?: RecalledSession;
}

export interface AgentResponse {
  message: string;
  mappedEmotion?: EmotionCheckIn;
  suggestedStack?: CalmStack;
  startSession?: boolean;
  recalledSessions?: RecalledSession[];
  memoryInsights?: MemoryInsight[];
  apiLogs?: ApiLogEntry[];
  /** Which LLM answered (or fallback) */
  model?: string;
  usedFallback?: boolean;
}

export interface ApiLogEntry {
  type: 'recall' | 'write';
  endpoint: string;
  timestamp: string;
  summary: string;
  /** Exact memory text written or recalled */
  contents?: string[];
  /** Search query when type is recall */
  query?: string;
  payload?: unknown;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  spiritualTone?: string;
  onboardingComplete: boolean;
}

export interface AppState {
  profile: UserProfile;
  messages: ChatMessage[];
  currentPreEmotion?: EmotionCheckIn;
  suggestedStack?: CalmStack;
  activeSession?: {
    stack: CalmStack;
    preEmotion: EmotionCheckIn;
    hrStart?: number;
    hrEnd?: number;
    startedAt: string;
    /** Past session recalled from HydraDB that shaped this meditation */
    recalledSession?: RecalledSession;
  };
  timeline: SessionRecord[];
  memoryInsights: MemoryInsight[];
  apiLogs: ApiLogEntry[];
  forgetMode: boolean;
}

export const EMOTIONS: EmotionWord[] = [
  { label: 'anxious', quadrant: 'red', energy: 0.85, pleasantness: 0.2 },
  { label: 'stressed', quadrant: 'red', energy: 0.8, pleasantness: 0.25 },
  { label: 'angry', quadrant: 'red', energy: 0.9, pleasantness: 0.15 },
  { label: 'overwhelmed', quadrant: 'red', energy: 0.85, pleasantness: 0.2 },
  { label: 'restless', quadrant: 'red', energy: 0.75, pleasantness: 0.35 },
  { label: 'frustrated', quadrant: 'red', energy: 0.8, pleasantness: 0.25 },
  { label: 'sad', quadrant: 'blue', energy: 0.25, pleasantness: 0.2 },
  { label: 'tired', quadrant: 'blue', energy: 0.2, pleasantness: 0.3 },
  { label: 'lonely', quadrant: 'blue', energy: 0.3, pleasantness: 0.25 },
  { label: 'numb', quadrant: 'blue', energy: 0.15, pleasantness: 0.35 },
  { label: 'discouraged', quadrant: 'blue', energy: 0.25, pleasantness: 0.2 },
  { label: 'bored', quadrant: 'blue', energy: 0.2, pleasantness: 0.4 },
  { label: 'excited', quadrant: 'yellow', energy: 0.85, pleasantness: 0.85 },
  { label: 'hopeful', quadrant: 'yellow', energy: 0.75, pleasantness: 0.8 },
  { label: 'inspired', quadrant: 'yellow', energy: 0.8, pleasantness: 0.85 },
  { label: 'grateful', quadrant: 'yellow', energy: 0.7, pleasantness: 0.9 },
  { label: 'playful', quadrant: 'yellow', energy: 0.75, pleasantness: 0.85 },
  { label: 'motivated', quadrant: 'yellow', energy: 0.8, pleasantness: 0.8 },
  { label: 'calm', quadrant: 'green', energy: 0.35, pleasantness: 0.85 },
  { label: 'peaceful', quadrant: 'green', energy: 0.3, pleasantness: 0.9 },
  { label: 'content', quadrant: 'green', energy: 0.4, pleasantness: 0.85 },
  { label: 'relaxed', quadrant: 'green', energy: 0.25, pleasantness: 0.88 },
  { label: 'tender', quadrant: 'green', energy: 0.35, pleasantness: 0.82 },
  { label: 'grounded', quadrant: 'green', energy: 0.3, pleasantness: 0.85 },
];

export const GUIDE_OPTIONS: Record<string, { label: string; description: string }> = {
  '4-7-8': { label: '4-7-8 Breath', description: 'Inhale 4, hold 7, exhale 8 — calming the nervous system.' },
  body_scan: { label: 'Body Scan', description: 'Gently move attention through each part of your body.' },
  box_breathing: { label: 'Box Breathing', description: 'Equal inhale, hold, exhale, hold — steady and grounding.' },
  loving_kindness: { label: 'Loving-Kindness', description: 'Send warmth to yourself and others.' },
};

export const MUSIC_OPTIONS: Record<string, { label: string; emoji: string }> = {
  soft_piano: { label: 'Soft Piano', emoji: '🎹' },
  nature: { label: 'Nature Sounds', emoji: '🌿' },
  '432hz': { label: '432Hz Ambient', emoji: '🎵' },
  ambient_drone: { label: 'Ambient Drone', emoji: '🌊' },
  silence: { label: 'Silence', emoji: '🤫' },
};

export const SCENT_OPTIONS: Record<string, { label: string; emoji: string }> = {
  lavender: { label: 'Lavender', emoji: '💜' },
  sandalwood: { label: 'Sandalwood', emoji: '🪵' },
  eucalyptus: { label: 'Eucalyptus', emoji: '🌿' },
  none: { label: 'None', emoji: '—' },
};

export const LIGHTING_OPTIONS: Record<string, { label: string; gradient: string; description: string }> = {
  warm_glow: {
    label: 'Warm Glow',
    gradient: 'from-amber-900/80 via-orange-950/60 to-still-bg',
    description: 'Soft amber, low brightness — ideal when anxious.',
  },
  candlelight: {
    label: 'Candlelight',
    gradient: 'from-yellow-900/40 via-amber-950/70 to-black',
    description: 'Gentle flicker simulation, very dim.',
  },
  dawn: {
    label: 'Dawn',
    gradient: 'from-orange-300/30 via-rose-200/20 to-still-bg',
    description: 'Gradual warm light — good when tired.',
  },
  moonlight: {
    label: 'Moonlight',
    gradient: 'from-slate-400/20 via-indigo-950/50 to-still-bg',
    description: 'Cool, minimal — focus and breath work.',
  },
  dark_room: {
    label: 'Dark Room',
    gradient: 'from-black via-still-bg to-black',
    description: 'Near-black — eyes closed mode.',
  },
};

export function stackLabel(stack: CalmStack): string {
  const guide = GUIDE_OPTIONS[stack.guide]?.label ?? stack.guide;
  const music = MUSIC_OPTIONS[stack.music]?.label ?? stack.music;
  const scent = SCENT_OPTIONS[stack.scent]?.label ?? stack.scent;
  const lighting = LIGHTING_OPTIONS[stack.lighting]?.label ?? stack.lighting;
  return `${guide} · ${music} · ${scent} · ${lighting}`;
}

export function formatUserProfileMemory(profile: {
  displayName?: string;
  userId?: string;
  spiritualTone?: string;
  notes?: string[];
}): string {
  const head = [
    profile.displayName ? `User profile: ${profile.displayName}` : 'User profile',
    profile.userId ? `(${profile.userId})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const tone = profile.spiritualTone ? `Spiritual tone: ${profile.spiritualTone}.` : '';
  const notes = profile.notes?.join(' ') ?? '';
  return `${head}. ${tone} ${notes}`.trim();
}

export function formatSessionMemory(session: SessionRecord, extras?: SessionMemoryExtras): string {
  const pre = session.preEmotion;
  const post = session.postEmotion;

  const durationMin =
    extras?.durationMin ??
    (session.durationSec != null ? Math.max(1, Math.round(session.durationSec / 60)) : undefined);

  const beforeParts = [
    `pre-emotion ${pre.label} (${pre.quadrant} quadrant)`,
    extras?.preMoodColor ? `mood color ${extras.preMoodColor}` : null,
    `energy ${pre.energy.toFixed(2)}, pleasantness ${pre.pleasantness.toFixed(2)}`,
    session.hrStart != null ? `HR ~${Math.round(session.hrStart)} bpm` : null,
    pre.note ? `note: ${pre.note}` : null,
    extras?.eyeBlinkPerMin != null ? `eye blink ${extras.eyeBlinkPerMin}/min` : null,
    extras?.voicePitchHz != null ? `voice pitch +${extras.voicePitchHz} Hz` : null,
  ].filter(Boolean);

  const stackSummary = stackLabel(session.stack);
  const duringParts = [
    durationMin != null ? `duration ${durationMin} min` : null,
    session.durationSec != null ? `elapsed ${session.durationSec}s` : null,
    `guide=${session.stack.guide}`,
    `music=${session.stack.music}`,
    `scent=${session.stack.scent}`,
    `lighting=${session.stack.lighting}`,
    `stack: ${stackSummary}`,
    extras?.deviceScent ? `device scent: ${extras.deviceScent}` : null,
    extras?.deviceSound ? `device sound: ${extras.deviceSound}` : null,
    extras?.musicBpm != null ? `music BPM ${extras.musicBpm}` : null,
  ].filter(Boolean);

  const afterParts = [
    post
      ? `post-emotion ${post.label} (${post.quadrant} quadrant)`
      : 'post-emotion unknown',
    extras?.postMoodColor ? `mood color ${extras.postMoodColor}` : null,
    post ? `energy ${post.energy.toFixed(2)}, pleasantness ${post.pleasantness.toFixed(2)}` : null,
    session.hrStart != null && session.hrEnd != null
      ? `HR ${Math.round(session.hrStart)}→${Math.round(session.hrEnd)}`
      : null,
    session.calmScore != null ? `calm score ${session.calmScore}%` : null,
    session.rating != null ? `Rated ${session.rating}/5` : null,
    session.outcome ? `outcome: ${session.outcome}` : null,
    session.userNote ? `user note: ${session.userNote}` : null,
    extras?.scentReactionScore != null ? `scent reaction ${extras.scentReactionScore}` : null,
    extras?.soundReactionScore != null ? `sound reaction ${extras.soundReactionScore}` : null,
    extras?.experienceScore != null ? `experience score ${extras.experienceScore}` : null,
  ].filter(Boolean);

  const changeParts: string[] = [];
  if (post) {
    changeParts.push(
      `emotion shift: ${pre.label} (${pre.quadrant}) → ${post.label} (${post.quadrant})`,
    );
    if (extras?.preMoodColor && extras?.postMoodColor) {
      changeParts.push(`mood color: ${extras.preMoodColor} → ${extras.postMoodColor}`);
    }
    if (pre.quadrant !== post.quadrant) {
      changeParts.push(`quadrant: ${pre.quadrant} → ${post.quadrant}`);
    }
    if (session.hrStart != null && session.hrEnd != null) {
      const drop = Math.round(session.hrStart - session.hrEnd);
      const pct = Math.round(((session.hrStart - session.hrEnd) / session.hrStart) * 100);
      changeParts.push(`body: HR dropped ${drop} bpm (${pct}%)`);
    }
    if (pre.label !== post.label) {
      changeParts.push(`felt ${pre.label} before, ${post.label} after`);
    }
  }

  return [
    `Session ${session.date} id=${session.id}`,
    `BEFORE: ${beforeParts.join('; ')}.`,
    `DURING meditation: ${duringParts.join('; ')}.`,
    `AFTER: ${afterParts.join('; ')}.`,
    changeParts.length ? `CHANGE: ${changeParts.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function getUserId(): string {
  const key = 'still_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `user_${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
