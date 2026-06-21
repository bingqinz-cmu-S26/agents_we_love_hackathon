import 'dotenv/config';
import { resetAndSeedJasonJourney } from '../server/services/hydradb.js';
import { DEMO_PERSON } from '../src/data/mockJasonHistory.js';

const userId = process.argv[2] ?? DEMO_PERSON.userId;

console.log('Resetting HydraDB memories for:', userId);
const { clearLog, seedLog } = await resetAndSeedJasonJourney(userId);

console.log('--- CLEAR ---');
console.log(clearLog.summary);
console.log(clearLog.contents?.join('\n') ?? '');

console.log('--- SEED ---');
console.log(seedLog.summary);
console.log(`Stored ${seedLog.contents?.length ?? 0} memory texts`);
