import { Router } from 'express';
import {
  applyMemoryPreferences,
  recallForAgent,
  suggestStackFromRecall,
} from '../services/hydradb.js';
import { generateAgentReply, mapEmotionFromText } from '../services/nebius.js';
import type { AgentResponse, CalmStack } from '../../src/types.js';

export const chatRouter = Router();

function emotionFromHistory(
  messages: Array<{ role: string; content: string }>,
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') continue;
    const mapped = mapEmotionFromText(messages[i].content);
    if (mapped?.label) return mapped.label;
  }
  return undefined;
}

chatRouter.post('/', async (req, res) => {
  try {
    const {
      userId,
      messages = [],
      latestMessage,
      forgetMode = false,
      spiritualTone,
      selectedEmotion,
      conversationEmotion,
    } = req.body as {
      userId: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      latestMessage: string;
      forgetMode?: boolean;
      spiritualTone?: string;
      selectedEmotion?: { label: string; quadrant: string };
      conversationEmotion?: string;
    };

    if (!userId || !latestMessage) {
      res.status(400).json({ error: 'userId and latestMessage required' });
      return;
    }

    const emotionLabel =
      selectedEmotion?.label ??
      mapEmotionFromText(latestMessage)?.label ??
      conversationEmotion ??
      emotionFromHistory(messages);

    const { insights, recalledSessions, logs } = await recallForAgent(
      userId,
      emotionLabel,
      forgetMode,
    );

    const memoryContext = insights.map((i) => i.text).join('\n');

    let suggestedStack: CalmStack | undefined;
    if (emotionLabel) {
      suggestedStack = suggestStackFromRecall(emotionLabel, recalledSessions);
    }
    if (suggestedStack && memoryContext) {
      suggestedStack = applyMemoryPreferences(suggestedStack, memoryContext);
    }

    const { message, startSession, model, usedFallback } = await generateAgentReply({
      messages,
      memoryContext,
      recalledSessions,
      suggestedStack,
      spiritualTone,
      latestUserMessage: latestMessage,
    });

    const mappedEmotion =
      selectedEmotion && selectedEmotion.label
        ? {
            label: selectedEmotion.label,
            quadrant: selectedEmotion.quadrant as 'red' | 'blue' | 'yellow' | 'green',
            energy: 0.5,
            pleasantness: 0.5,
            phase: 'pre' as const,
            timestamp: new Date().toISOString(),
          }
        : mapEmotionFromText(latestMessage, 'pre') ??
          (emotionLabel
            ? {
                label: emotionLabel,
                quadrant: 'red' as const,
                energy: 0.5,
                pleasantness: 0.5,
                phase: 'pre' as const,
                timestamp: new Date().toISOString(),
              }
            : undefined);

    const topRecalled = recalledSessions.find(
      (s) => emotionLabel && s.preEmotion.toLowerCase() === emotionLabel.toLowerCase(),
    );

    const response: AgentResponse = {
      message,
      mappedEmotion,
      suggestedStack: suggestedStack ?? topRecalled?.stack,
      startSession: startSession && Boolean(suggestedStack ?? topRecalled?.stack),
      recalledSessions: topRecalled ? [topRecalled] : recalledSessions.slice(0, 2),
      memoryInsights: insights.slice(0, 6).map((i) => ({ text: i.text })),
      apiLogs: logs,
      model,
      usedFallback,
    };

    if (response.startSession) {
      response.suggestedStack = suggestedStack ?? topRecalled?.stack;
    }

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate agent response' });
  }
});
