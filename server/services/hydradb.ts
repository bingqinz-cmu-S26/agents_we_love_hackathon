import { randomUUID } from 'crypto';
import type { ApiLogEntry, CalmStack, MemoryInsight, RecalledSession, SessionRecord } from '../../src/types.js';
import { formatSessionMemory, formatUserProfileMemory } from '../../src/types.js';
import { jasonMemoryItems } from '../../src/data/mockJasonHistory.js';

const TENANT_ID = process.env.HYDRA_TENANT_ID ?? 'still_meditation_copilot';

type MemoryStore = Map<string, string[]>;
const localFallbackStore: MemoryStore = new Map();

type HydraClient = Awaited<ReturnType<typeof createClient>>;

async function createClient() {
  const token = process.env.HYDRA_DB_API_KEY;
  if (!token) return null;
  const { HydraDBClient } = await import('@hydradb/sdk');
  return new HydraDBClient({ token });
}

async function getClient(): Promise<HydraClient> {
  return createClient();
}

function isTenantReady(status: {
  data?: {
    infra?: {
      schedulerStatus?: boolean;
      graphStatus?: boolean;
      vectorstoreStatus?: { knowledge?: boolean; memories?: boolean };
      ready_for_ingestion?: boolean;
    };
  };
}): boolean {
  const infra = status.data?.infra;
  if (!infra) return false;
  if (infra.ready_for_ingestion) return true;
  return Boolean(
    infra.schedulerStatus &&
      infra.graphStatus &&
      infra.vectorstoreStatus?.knowledge &&
      infra.vectorstoreStatus?.memories,
  );
}

export async function ensureTenant(client: NonNullable<HydraClient>): Promise<void> {
  try {
    await client.tenants.create({ tenantId: TENANT_ID });
  } catch {
    // tenant may already exist
  }

  for (let i = 0; i < 40; i++) {
    const status = await client.tenants.status({ tenantId: TENANT_ID });
    if (isTenantReady(status)) return;
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export async function addMemories(
  userId: string,
  memories: string[],
  infer = true,
  sourceIds?: string[],
): Promise<ApiLogEntry> {
  const timestamp = new Date().toISOString();
  const client = await getClient();

  if (!client) {
    const existing = localFallbackStore.get(userId) ?? [];
    localFallbackStore.set(userId, [...memories, ...existing]);
    return {
      type: 'write',
      endpoint: 'local_fallback',
      timestamp,
      summary: `Saved ${memories.length} memories locally (set HYDRA_DB_API_KEY for HydraDB)`,
      contents: memories,
      payload: { memories },
    };
  }

  await ensureTenant(client);

  const memoryItems = memories.map((text, i) => ({
    source_id: sourceIds?.[i] ?? `mem_${randomUUID().slice(0, 12)}`,
    text,
    title: 'Presence meditation memory',
    infer,
    metadata: { userId, app: 'presence' },
  }));

  const result = await client.context.ingest({
    tenantId: TENANT_ID,
    subTenantId: userId,
    type: 'memory',
    memories: JSON.stringify(memoryItems),
    upsert: true,
  });

  return {
    type: 'write',
    endpoint: 'POST context/ingest (type: memory)',
    timestamp,
    summary: `Saved ${memories.length} memories to HydraDB for ${userId}`,
    contents: memories,
    payload: result,
  };
}

function extractMemorySourceId(row: Record<string, unknown>): string {
  for (const key of ['source_id', 'sourceId', 'id']) {
    const val = row[key];
    if (typeof val === 'string' && val) return val;
  }
  return '';
}

async function listMemorySourceIds(
  client: NonNullable<HydraClient>,
  userId: string,
): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const pageSize = 50;

  while (page <= 40) {
    const result = await client.context.list({
      tenantId: TENANT_ID,
      subTenantId: userId,
      type: 'memory',
      page,
      pageSize,
    });

    const sources = result.data?.inner?.sources ?? [];
    for (const raw of sources) {
      const id = extractMemorySourceId(raw as Record<string, unknown>);
      if (id) ids.push(id);
    }

    if (sources.length < pageSize) break;
    page += 1;
  }

  return ids;
}

export async function clearUserMemories(userId: string): Promise<ApiLogEntry> {
  const timestamp = new Date().toISOString();
  const client = await getClient();

  if (!client) {
    const count = (localFallbackStore.get(userId) ?? []).length;
    localFallbackStore.delete(userId);
    return {
      type: 'write',
      endpoint: 'local_fallback_clear',
      timestamp,
      summary: `Cleared ${count} local fallback memories for ${userId}`,
      contents: count ? [`Removed ${count} in-memory record(s)`] : ['No local memories to clear'],
      payload: { deletedCount: count },
    };
  }

  await ensureTenant(client);
  const ids = await listMemorySourceIds(client, userId);

  if (ids.length === 0) {
    return {
      type: 'write',
      endpoint: 'POST context/delete (type: memory)',
      timestamp,
      summary: `No HydraDB memories to clear for ${userId}`,
      contents: ['HydraDB was already empty for this userId'],
      payload: { deletedCount: 0 },
    };
  }

  let deletedCount = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const result = await client.context.delete({
      tenantId: TENANT_ID,
      subTenantId: userId,
      type: 'memory',
      ids: batch,
    });
    deletedCount += result.data?.deletedCount ?? batch.length;
  }

  return {
    type: 'write',
    endpoint: 'POST context/delete (type: memory)',
    timestamp,
    summary: `Cleared ${deletedCount} HydraDB memory sources for ${userId}`,
    contents: [`Deleted ${deletedCount} memory source(s) from HydraDB`],
    payload: { deletedCount, ids },
  };
}

export async function recallPreferences(
  userId: string,
  query: string,
  forgetMode = false,
): Promise<{ chunks: MemoryInsight[]; log: ApiLogEntry; raw?: unknown }> {
  const timestamp = new Date().toISOString();

  if (forgetMode) {
    return {
      chunks: [],
      log: {
        type: 'recall',
        endpoint: 'demo_forget_mode',
        timestamp,
        summary: 'Forget mode enabled — no memories recalled',
      },
    };
  }

  const client = await getClient();

  if (!client) {
    const stored = localFallbackStore.get(userId) ?? [];
    const lowerQuery = query.toLowerCase();
    const matched = stored.filter((m) =>
      m.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lowerQuery.includes(w.slice(0, 4))),
    );
    const chunks = (matched.length ? matched : stored).slice(0, 8).map((text) => ({ text }));
    const texts = chunks.map((c) => c.text);
    return {
      chunks,
      log: {
        type: 'recall',
        endpoint: 'local_fallback',
        timestamp,
        summary: `Recalled ${chunks.length} memories locally`,
        query,
        contents: texts,
        payload: { query, chunks },
      },
    };
  }

  await ensureTenant(client);

  const result = await client.query({
    tenantId: TENANT_ID,
    subTenantId: userId,
    query,
    type: 'memory',
    mode: 'fast',
    maxResults: 10,
  });

  const chunks: MemoryInsight[] = [];
  const data = result.data;
  if (data?.chunks) {
    for (const c of data.chunks) {
      if (c.chunkContent) chunks.push({ text: c.chunkContent });
    }
  }

  const texts = chunks.map((c) => c.text);
  return {
    chunks,
    raw: result,
    log: {
      type: 'recall',
      endpoint: 'POST query (type: memory)',
      timestamp,
      summary: `Recalled ${chunks.length} preference memories from HydraDB`,
      query,
      contents: texts,
      payload: { query, chunkCount: chunks.length, chunks: texts },
    },
  };
}

function parseSessionFromMemory(text: string): RecalledSession | null {
  const dateMatch = text.match(/Session (\d{4}-\d{2}-\d{2}[^\n:]*)/);
  const preMatch = text.match(/pre-emotion (\w+)/);
  const postMatch = text.match(/post-emotion (\w+)/);
  const guideMatch = text.match(/guide=([\w-]+)/);
  const musicMatch = text.match(/music=([\w]+)/);
  const scentMatch = text.match(/scent=(\w+)/);
  const lightingMatch = text.match(/lighting=([\w_]+)/);
  const hrMatch = text.match(/HR (\d+)→(\d+)/);
  const ratingMatch = text.match(/Rated (\d)\/5/);

  if (!preMatch || !guideMatch) return null;

  return {
    date: dateMatch?.[1] ?? 'past session',
    preEmotion: preMatch[1],
    postEmotion: postMatch?.[1],
    stack: {
      guide: guideMatch[1],
      music: musicMatch?.[1] ?? 'soft_piano',
      scent: scentMatch?.[1] ?? 'lavender',
      lighting: lightingMatch?.[1] ?? 'warm_glow',
    },
    hrStart: hrMatch ? Number(hrMatch[1]) : undefined,
    hrEnd: hrMatch ? Number(hrMatch[2]) : undefined,
    rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
  };
}

function dedupeInsights(chunks: MemoryInsight[]): MemoryInsight[] {
  const seen = new Set<string>();
  const sorted = [...chunks].sort((a, b) => {
    const score = (t: string) =>
      (t.startsWith('User profile') ? 3 : 0) +
      (t.startsWith('Pattern:') ? 2 : 0) +
      (t.includes('Dislikes') || t.includes('prefers') ? 2 : 0);
    return score(b.text) - score(a.text);
  });
  return sorted.filter((c) => {
    const key = c.text.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function applyMemoryPreferences(stack: CalmStack, memoryContext: string): CalmStack {
  const lower = memoryContext.toLowerCase();
  const next = { ...stack };

  if (
    /sandalwood/.test(lower) &&
    (/positive|prefer|strong|best/.test(lower) || /dislikes.*lavender/.test(lower))
  ) {
    if (next.scent === 'lavender') next.scent = 'sandalwood';
  }
  if (/dislikes eucalyptus|dislike eucalyptus/.test(lower) && next.scent === 'eucalyptus') {
    next.scent = 'sandalwood';
  }
  if (/warm_glow|warm glow/.test(lower) && /anxious|red quadrant/.test(lower)) {
    next.lighting = 'warm_glow';
  }

  return next;
}

export async function recallForAgent(
  userId: string,
  emotionLabel: string | undefined,
  forgetMode: boolean,
): Promise<{
  insights: MemoryInsight[];
  recalledSessions: RecalledSession[];
  logs: ApiLogEntry[];
}> {
  const queries = [
    'user meditation preferences music scent lighting spiritual tone dislikes',
    emotionLabel
      ? `sessions when user felt ${emotionLabel} what calm stack worked heart rate improvement`
      : 'past meditation sessions calm stack outcomes heart rate',
    'effective meditation sessions rated highly',
  ];

  const logs: ApiLogEntry[] = [];
  const allChunks: MemoryInsight[] = [];
  const sessions: RecalledSession[] = [];

  for (const query of queries) {
    const { chunks, log } = await recallPreferences(userId, query, forgetMode);
    logs.push(log);
    allChunks.push(...chunks);
    for (const c of chunks) {
      const parsed = parseSessionFromMemory(c.text);
      if (parsed) sessions.push(parsed);
    }
  }

  const uniqueSessions = sessions.filter(
    (s, i, arr) => arr.findIndex((x) => x.date === s.date && x.preEmotion === s.preEmotion) === i,
  );

  return {
    insights: dedupeInsights(allChunks).slice(0, 12),
    recalledSessions: uniqueSessions.slice(0, 5),
    logs,
  };
}

export async function saveSessionMemory(
  userId: string,
  session: SessionRecord,
  profileNotes?: string[],
): Promise<ApiLogEntry> {
  const memories = [formatSessionMemory(session)];
  if (profileNotes?.length) memories.push(...profileNotes);
  // Structured session narrative — skip infer to avoid duplicate "Extra context" rows
  return addMemories(userId, memories, false);
}

export async function saveOnboardingMemory(
  userId: string,
  spiritualTone: string,
  displayName?: string,
): Promise<ApiLogEntry> {
  const text = formatUserProfileMemory({
    displayName,
    userId,
    spiritualTone,
    notes: [
      'User wants a personalized meditation copilot that remembers emotions, calm stacks (guide, music, scent, lighting), and body responses across sessions.',
    ],
  });
  return addMemories(userId, [text], true);
}

/** Pick calm stack purely from HydraDB-recalled sessions (no LLM, no generic defaults). */
export function resolveStackFromMemory(
  recalledSessions: RecalledSession[],
  insights: MemoryInsight[],
  emotionLabel?: string,
): { stack?: CalmStack; session?: RecalledSession } {
  if (!recalledSessions.length) return {};

  const memoryContext = insights.map((i) => i.text).join('\n');
  let candidates = [...recalledSessions];

  if (emotionLabel) {
    const matched = candidates.filter(
      (s) => s.preEmotion.toLowerCase() === emotionLabel.toLowerCase(),
    );
    if (matched.length) candidates = matched;
  }

  const session = candidates.sort((a, b) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return b.date.localeCompare(a.date);
  })[0];

  const stack = applyMemoryPreferences(session.stack, memoryContext);
  return { stack, session };
}

export function suggestStackFromRecall(
  emotionLabel: string,
  recalled: RecalledSession[],
): CalmStack | undefined {
  const match = recalled.find(
    (s) => s.preEmotion.toLowerCase() === emotionLabel.toLowerCase() && (s.rating ?? 0) >= 4,
  );
  if (match) return match.stack;

  const quadrantDefaults: Record<string, CalmStack> = {
    anxious: { guide: '4-7-8', music: 'soft_piano', scent: 'lavender', lighting: 'warm_glow' },
    stressed: { guide: '4-7-8', music: 'soft_piano', scent: 'lavender', lighting: 'warm_glow' },
    overwhelmed: { guide: 'box_breathing', music: 'ambient_drone', scent: 'sandalwood', lighting: 'candlelight' },
    tired: { guide: 'body_scan', music: 'nature', scent: 'none', lighting: 'dawn' },
    sad: { guide: 'loving_kindness', music: '432hz', scent: 'sandalwood', lighting: 'warm_glow' },
    restless: { guide: 'box_breathing', music: 'nature', scent: 'eucalyptus', lighting: 'moonlight' },
  };

  return quadrantDefaults[emotionLabel.toLowerCase()];
}

export interface ListedMemory {
  id?: string;
  text?: string;
  title?: string;
  metadata?: unknown;
}

export async function listAllUserMemories(userId: string): Promise<{
  items: ListedMemory[];
  total: number;
  source: 'hydradb' | 'local_fallback';
  log: ApiLogEntry;
}> {
  const timestamp = new Date().toISOString();
  const client = await getClient();

  if (!client) {
    const stored = localFallbackStore.get(userId) ?? [];
    return {
      items: stored.map((text, i) => ({ id: `local_${i}`, text })),
      total: stored.length,
      source: 'local_fallback',
      log: {
        type: 'recall',
        endpoint: 'local_fallback_list',
        timestamp,
        summary: `Listed ${stored.length} in-memory fallback memories`,
        contents: stored,
      },
    };
  }

  await ensureTenant(client);

  const items: ListedMemory[] = [];
  let page = 1;
  const pageSize = 50;

  while (page <= 30) {
    const result = await client.context.list({
      tenantId: TENANT_ID,
      subTenantId: userId,
      type: 'memory',
      page,
      pageSize,
      includeFields: ['content', 'title', 'note'],
    });

    const sources = result.data?.inner?.sources ?? [];
    for (const raw of sources) {
      const row = raw as Record<string, unknown>;
      const content = row.content;
      const text =
        typeof content === 'string'
          ? content
          : typeof row.note === 'string'
            ? row.note
            : undefined;
      items.push({
        id: extractMemorySourceId(row),
        text,
        title: typeof row.title === 'string' ? row.title : undefined,
      });
    }

    if (sources.length < pageSize) break;
    page += 1;
  }

  const texts = items.map((item) => item.text).filter((t): t is string => Boolean(t));
  return {
    items,
    total: items.length,
    source: 'hydradb',
    log: {
      type: 'recall',
      endpoint: 'POST context/list (type: memory)',
      timestamp,
      summary: `Listed ${items.length} memory records in HydraDB for ${userId}`,
      contents: texts,
      payload: { tenant: TENANT_ID, subTenantId: userId, listed: texts.length },
    },
  };
}

export async function seedDemoMemory(userId: string): Promise<ApiLogEntry> {
  const demoDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
  const profile = formatUserProfileMemory({
    spiritualTone: 'gentle',
    notes: ['User wants personalized meditation with memory of emotions and calm stacks.'],
  });
  const session: SessionRecord = {
    id: 'demo_session',
    date: demoDate,
    preEmotion: {
      label: 'anxious',
      quadrant: 'red',
      energy: 0.85,
      pleasantness: 0.2,
      phase: 'pre',
      timestamp: demoDate,
    },
    postEmotion: {
      label: 'peaceful',
      quadrant: 'green',
      energy: 0.3,
      pleasantness: 0.9,
      phase: 'post',
      timestamp: demoDate,
    },
    stack: { guide: '4-7-8', music: 'soft_piano', scent: 'lavender', lighting: 'warm_glow' },
    hrStart: 84,
    hrEnd: 62,
    calmScore: 26,
    rating: 5,
    userNote: 'work stress about tomorrow',
    outcome: 'effective',
    durationSec: 720,
  };
  const preference = 'User prefers warm_glow lighting when anxious. Dislikes eucalyptus scent.';
  await addMemories(userId, [profile, preference], true);
  return addMemories(userId, [formatSessionMemory(session)], false);
}

export async function seedJasonJourney(userId: string): Promise<ApiLogEntry> {
  const items = jasonMemoryItems();
  const logs: ApiLogEntry[] = [];

  for (let i = 0; i < items.length; i += 5) {
    const chunk = items.slice(i, i + 5);
    const infer = chunk.every((item) => item.infer !== false);
    logs.push(
      await addMemories(
        userId,
        chunk.map((item) => item.text),
        infer,
        chunk.map((item) => item.sourceId),
      ),
    );
  }

  const texts = items.map((item) => item.text);
  return {
    type: 'write',
    endpoint: 'bulk seed jason journey',
    timestamp: new Date().toISOString(),
    summary: `Seeded ${items.length} Jason v2 memories to HydraDB for ${userId}`,
    contents: texts,
    payload: { batches: logs.length, itemCount: items.length },
  };
}

export async function resetAndSeedJasonJourney(userId: string): Promise<{
  clearLog: ApiLogEntry;
  seedLog: ApiLogEntry;
}> {
  const clearLog = await clearUserMemories(userId);
  const seedLog = await seedJasonJourney(userId);
  return { clearLog, seedLog };
}
