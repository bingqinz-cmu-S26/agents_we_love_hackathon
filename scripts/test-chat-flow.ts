import 'dotenv/config';
import { recallForAgent, suggestStackFromRecall } from '../server/services/hydradb.js';
import { generateAgentReply } from '../server/services/nebius.js';

const userId = 'test_chat_user';
const latestMessage = "I'm feeling anxious";

const emotionLabel = 'anxious';
const { insights, recalledSessions, logs } = await recallForAgent(userId, emotionLabel, false);
const memoryContext = insights.map((i) => i.text).join('\n');
const suggestedStack = suggestStackFromRecall(emotionLabel, recalledSessions);

const { message } = await generateAgentReply({
  messages: [{ role: 'user', content: latestMessage }],
  memoryContext,
  recalledSessions,
  suggestedStack,
  spiritualTone: 'spiritual',
  latestUserMessage: latestMessage,
});

console.log('MESSAGE:', message);
console.log('STACK:', suggestedStack);
console.log('LOGS:', logs.length);
