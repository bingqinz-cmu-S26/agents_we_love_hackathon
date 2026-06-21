import 'dotenv/config';
import { listAllUserMemories } from '../server/services/hydradb.js';

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npx tsx scripts/list-memories.ts <userId>');
  console.error('Get userId from browser: localStorage.getItem("still_user_id")');
  process.exit(1);
}

const { items, total, source, log } = await listAllUserMemories(userId);
console.log('userId:', userId);
console.log('source:', source);
console.log('log:', log.summary);
console.log('total:', total);
console.log('---');
items.forEach((item, i) => {
  console.log(`[${i + 1}] ${item.id ?? '—'}`);
  console.log(item.text ?? JSON.stringify(item));
  console.log('---');
});
