import OpenAI from 'openai';
import type { CalmStack, EmotionCheckIn, RecalledSession } from '../../src/types.js';
import { GUIDE_OPTIONS, LIGHTING_OPTIONS, MUSIC_OPTIONS, SCENT_OPTIONS } from '../../src/types.js';

const client = process.env.NEBIUS_API_KEY
  ? new OpenAI({
      apiKey: process.env.NEBIUS_API_KEY,
      baseURL: 'https://api.tokenfactory.nebius.com/v1/',
    })
  : null;

const MODEL = process.env.NEBIUS_MODEL ?? 'Qwen/Qwen3-235B-A22B-Instruct-2507';

/** Short label for chat UI */
export function getAgentModelLabel(): string {
  if (!client) return 'memory-backed-fallback';
  const id = MODEL;
  if (id.includes('Qwen3-235B')) return 'Qwen3-235B Instruct';
  if (id.includes('Hermes-4-405B')) return 'Hermes 4 405B';
  if (id.includes('Nemotron-Ultra')) return 'Nemotron Ultra 253B';
  if (id.includes('gpt-oss')) return 'GPT-OSS 120B';
  if (id.includes('Llama-3.3')) return 'Llama 3.3 70B';
  return id.split('/').pop() ?? id;
}

export function getAgentModel(): string {
  return client ? MODEL : 'memory-backed-fallback';
}

function stackDescription(stack: CalmStack): string {
  return [
    `Guide: ${GUIDE_OPTIONS[stack.guide]?.label ?? stack.guide}`,
    `Music: ${MUSIC_OPTIONS[stack.music]?.label ?? stack.music}`,
    `Scent: ${SCENT_OPTIONS[stack.scent]?.label ?? stack.scent}`,
    `Lighting: ${LIGHTING_OPTIONS[stack.lighting]?.label ?? stack.lighting}`,
  ].join(', ');
}

/** Natural phrasing for spoken / companion replies */
function stackDescriptionNatural(stack: CalmStack): string {
  const guide = GUIDE_OPTIONS[stack.guide]?.label ?? stack.guide;
  const music = MUSIC_OPTIONS[stack.music]?.label ?? stack.music;
  const scent = SCENT_OPTIONS[stack.scent]?.label ?? stack.scent;
  const light = LIGHTING_OPTIONS[stack.lighting]?.label ?? stack.lighting;
  return `${guide.toLowerCase()}, ${music}, ${scent}, and ${light.toLowerCase()}`;
}

const SPIRITUAL_TONE_VOICE: Record<string, string> = {
  gentle:
    'Warm and secular. Like a close friend in a quiet room — no jargon, no preaching, no performance.',
  spiritual:
    'Spacious and open. Soft images of breath, light, and presence. Never dogmatic or overly mystical.',
  scientific:
    'Grounded and clear, but still human. Notice the body gently — never clinical, never metric-heavy.',
  contemplative:
    'Very sparse. One or two sentences. Long silences implied between words. Almost like a whisper.',
};

function spiritualToneGuide(spiritualTone?: string): string {
  const key = spiritualTone?.toLowerCase() ?? 'gentle';
  if (key.includes('spiritual')) return SPIRITUAL_TONE_VOICE.spiritual;
  if (key.includes('science') || key.includes('scientific')) return SPIRITUAL_TONE_VOICE.scientific;
  if (key.includes('contemplat')) return SPIRITUAL_TONE_VOICE.contemplative;
  return SPIRITUAL_TONE_VOICE.gentle;
}

function buildSystemPrompt(
  memoryContext: string,
  recalledSessions: RecalledSession[],
  spiritualTone?: string,
  suggestedStack?: CalmStack,
): string {
  const sessionSummaries = recalledSessions
    .map(
      (s) =>
        `- ${s.date}: ${s.preEmotion}${s.postEmotion ? ` → ${s.postEmotion}` : ''}. What helped: ${stackDescriptionNatural(s.stack)}.${s.rating && s.rating >= 4 ? ' It worked well.' : ''}`,
    )
    .join('\n');

  const recommended = suggestedStack
    ? `\nFor this moment, lean toward: ${stackDescriptionNatural(suggestedStack)}. Use those exact experience names if you mention them.\n`
    : '';

  const allowedNames = [
    ...Object.values(MUSIC_OPTIONS).map((m) => m.label),
    ...Object.values(SCENT_OPTIONS).map((s) => s.label),
    ...Object.values(LIGHTING_OPTIONS).map((l) => l.label),
    ...Object.values(GUIDE_OPTIONS).map((g) => g.label),
  ].join(', ');

  return `You are Presence — a meditation companion sharing quiet space with someone. You are NOT a medical device, wellness dashboard, or customer support bot.

HOW YOU SOUND (follow this strictly):
${spiritualToneGuide(spiritualTone)}
- Whisper companion, not chatbot. Short sentences. Often just one or two.
- Never use bullet points, numbered lists, or labels like "Guide:" / "Music:" / "Scent:".
- Never say: calm stack, heart rate, HR, rated, session data, leverage, utilize, based on your profile.
- Do not start every reply with "I remember" or "I can sense that". Vary your openings. Sometimes just sit with them.
- When memory helps, weave it in naturally: "Last time the rain and sandalwood carried you somewhere softer" — not a timestamp report.
- Name experiences only from this list: ${allowedNames}. Never invent titles like "Weightless".
- If they want to begin (yes / okay / let's), gently confirm what you're holding for them — then stop talking.
- Wellness only — no diagnosis. If vitals appear in memory, don't recite numbers unless it truly helps; prefer "your body settled" over "84 to 62".
- Length: usually 1–3 sentences. Contemplative tone → often 1.

MEMORY (facts — use truthfully, don't recite robotically):
${memoryContext || 'No prior memories — first visit or memory not loaded yet.'}

PAST MOMENTS THAT HELPED:
${sessionSummaries || 'None recalled yet.'}
${recommended}`;
}

function detectEmotion(text: string): Partial<EmotionCheckIn> | undefined {
  const lower = text.toLowerCase();
  const keywords: Record<string, string> = {
    anxious: 'anxious',
    anxiety: 'anxious',
    stressed: 'stressed',
    stress: 'stressed',
    angry: 'angry',
    overwhelmed: 'overwhelmed',
    restless: 'restless',
    sad: 'sad',
    tired: 'tired',
    lonely: 'lonely',
    calm: 'calm',
    peaceful: 'peaceful',
    excited: 'excited',
    grateful: 'grateful',
  };
  for (const [key, label] of Object.entries(keywords)) {
    if (lower.includes(key)) {
      const quadrantMap: Record<string, EmotionCheckIn['quadrant']> = {
        anxious: 'red',
        stressed: 'red',
        angry: 'red',
        overwhelmed: 'red',
        restless: 'red',
        sad: 'blue',
        tired: 'blue',
        lonely: 'blue',
        calm: 'green',
        peaceful: 'green',
        excited: 'yellow',
        grateful: 'yellow',
      };
      return { label, quadrant: quadrantMap[label] ?? 'red' };
    }
  }
  return undefined;
}

function userWantsSession(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(yes|yeah|yep|sure|ok|okay|let's|lets|please|do it|start|go ahead)/.test(lower);
}

export async function generateAgentReply(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryContext: string;
  recalledSessions: RecalledSession[];
  suggestedStack?: CalmStack;
  spiritualTone?: string;
  latestUserMessage: string;
}): Promise<{ message: string; startSession: boolean; model: string; usedFallback: boolean }> {
  const detected = detectEmotion(params.latestUserMessage);
  const wantsSession = userWantsSession(params.latestUserMessage);
  const model = getAgentModel();

  if (!client) {
    const fallback = generateFallbackReply(params, detected, wantsSession);
    return { ...fallback, model, usedFallback: true };
  }

  const system = buildSystemPrompt(
    params.memoryContext,
    params.recalledSessions,
    params.spiritualTone,
    params.suggestedStack,
  );

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.62,
      top_p: 0.9,
      max_tokens: 220,
      messages: [
        { role: 'system', content: system },
        ...params.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const message =
      completion.choices[0]?.message?.content?.trim() ??
      generateFallbackReply(params, detected, wantsSession).message;
    const startSession = wantsSession && Boolean(params.suggestedStack);
    return { message, startSession, model: getAgentModelLabel(), modelId: MODEL, usedFallback: false };
  } catch (error) {
    console.error('Nebius error, using memory-backed fallback:', error);
    const fallback = generateFallbackReply(params, detected, wantsSession);
    return { ...fallback, model: 'memory-backed-fallback', usedFallback: true };
  }
}

function formatStackAdvice(stack: CalmStack, fromMemory: boolean): string {
  const natural = stackDescriptionNatural(stack);
  return fromMemory
    ? `What helped before was ${natural}.`
    : `Maybe ${natural} for right now.`;
}

function generateFallbackReply(
  params: {
    memoryContext: string;
    recalledSessions: RecalledSession[];
    suggestedStack?: CalmStack;
    latestUserMessage: string;
  },
  detected?: Partial<EmotionCheckIn>,
  wantsSession = false,
): { message: string; startSession: boolean } {
  const emotion = detected?.label;
  const past = params.recalledSessions.find(
    (s) => detected?.label && s.preEmotion.toLowerCase() === detected.label.toLowerCase(),
  );

  if (wantsSession && params.suggestedStack) {
    return {
      message: `Okay. I'm holding ${stackDescriptionNatural(params.suggestedStack)} for you. Just arrive.`,
      startSession: true,
    };
  }

  if (past && params.suggestedStack) {
    return {
      message: emotion
        ? `There's a lot in that ${emotion}. Last time, ${stackDescriptionNatural(params.suggestedStack)} helped you soften. Want to try again?`
        : `Last time, ${stackDescriptionNatural(params.suggestedStack)} helped. Want to try again?`,
      startSession: false,
    };
  }

  if (params.suggestedStack) {
    return {
      message: emotion
        ? `I hear the ${emotion}. ${formatStackAdvice(params.suggestedStack, params.recalledSessions.length > 0)}`
        : formatStackAdvice(params.suggestedStack, params.recalledSessions.length > 0),
      startSession: false,
    };
  }

  return {
    message: "I'm here. How are you arriving today — in your body, not just in words?",
    startSession: false,
  };
}

export function mapEmotionFromText(text: string, phase: 'pre' | 'post' = 'pre'): EmotionCheckIn | undefined {
  const detected = detectEmotion(text);
  if (!detected?.label || !detected.quadrant) return undefined;

  const defaults: Record<string, { energy: number; pleasantness: number }> = {
    anxious: { energy: 0.85, pleasantness: 0.2 },
    stressed: { energy: 0.8, pleasantness: 0.25 },
    tired: { energy: 0.2, pleasantness: 0.3 },
    calm: { energy: 0.35, pleasantness: 0.85 },
    peaceful: { energy: 0.3, pleasantness: 0.9 },
  };

  const d = defaults[detected.label] ?? { energy: 0.5, pleasantness: 0.5 };

  return {
    label: detected.label,
    quadrant: detected.quadrant,
    energy: d.energy,
    pleasantness: d.pleasantness,
    phase,
    timestamp: new Date().toISOString(),
  };
}
