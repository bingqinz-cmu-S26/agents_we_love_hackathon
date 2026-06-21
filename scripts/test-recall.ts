import 'dotenv/config';
import { recallForAgent, recallPreferences } from '../server/services/hydradb.js';

const userId = process.argv[2] ?? 'user_test';
const { chunks, raw, log } = await recallPreferences(userId, 'anxious meditation sandalwood', false);
console.log('userId:', userId);
console.log('log:', log.summary, log.endpoint);
console.log('chunks:', chunks.length);
console.log('raw keys:', raw ? Object.keys(raw as object) : 'none');
if (raw && typeof raw === 'object' && 'data' in raw) {
  const data = (raw as { data?: { chunks?: unknown[] } }).data;
  console.log('data.chunks:', data?.chunks?.length ?? 0);
}
chunks.slice(0, 3).forEach((c, i) => console.log(`chunk ${i}:`, c.text.slice(0, 120)));

const r = await recallForAgent(userId, 'anxious', false);
console.log('recallForAgent insights:', r.insights.length, 'sessions:', r.recalledSessions.length);
