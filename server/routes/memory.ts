import { Router } from 'express';
import {
  listAllUserMemories,
  recallForAgent,
  recallPreferences,
  resolveStackFromMemory,
  saveOnboardingMemory,
  saveSessionMemory,
} from '../services/hydradb.js';
import type { SessionRecord } from '../../src/types.js';
import { emotionCheckInFromLabel } from '../../src/lib/emotion.js';
import { FRESH_START_STACK } from '../../src/lib/freshStart.js';

export const memoryRouter = Router();

memoryRouter.get('/recall/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const forgetMode = req.query.forgetMode === 'true';
    const { insights, recalledSessions, logs } = await recallForAgent(userId, undefined, forgetMode);

    res.json({ insights, recalledSessions, logs });
  } catch (error) {
    console.error('Recall error:', error);
    res.status(500).json({ error: 'Failed to recall memories' });
  }
});

memoryRouter.post('/session', async (req, res) => {
  try {
    const { userId, session } = req.body as { userId: string; session: SessionRecord };
    if (!userId || !session) {
      res.status(400).json({ error: 'userId and session required' });
      return;
    }

    const log = await saveSessionMemory(userId, session);
    res.json({ ok: true, log });
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Failed to save session memory' });
  }
});

memoryRouter.post('/onboarding', async (req, res) => {
  try {
    const { userId, spiritualTone, displayName } = req.body as {
      userId: string;
      spiritualTone: string;
      displayName?: string;
    };

    const log = await saveOnboardingMemory(userId, spiritualTone, displayName);
    res.json({ ok: true, log });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save onboarding memory' });
  }
});

memoryRouter.post('/seed-journey', async (req, res) => {
  try {
    const { userId } = req.body as { userId: string };
    const { resetAndSeedJasonJourney } = await import('../services/hydradb.js');
    const { clearLog, seedLog } = await resetAndSeedJasonJourney(userId);
    res.json({ ok: true, clearLog, log: seedLog, logs: [clearLog, seedLog] });
  } catch (error) {
    console.error('Seed journey error:', error);
    res.status(500).json({ error: 'Failed to seed journey memory' });
  }
});

memoryRouter.post('/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { clearUserMemories } = await import('../services/hydradb.js');
    const log = await clearUserMemories(userId);
    res.json({ ok: true, log });
  } catch (error) {
    console.error('Clear memory error:', error);
    res.status(500).json({ error: 'Failed to clear memories' });
  }
});

memoryRouter.post('/seed-demo', async (req, res) => {
  try {
    const { userId } = req.body as { userId: string };
    const { seedDemoMemory } = await import('../services/hydradb.js');
    const log = await seedDemoMemory(userId);
    res.json({ ok: true, log });
  } catch (error) {
    console.error('Seed demo error:', error);
    res.status(500).json({ error: 'Failed to seed demo memory' });
  }
});

memoryRouter.post('/preference', async (req, res) => {
  try {
    const { userId, text } = req.body as { userId: string; text: string };
    const { addMemories } = await import('../services/hydradb.js');
    const log = await addMemories(userId, [text], true);
    res.json({ ok: true, log });
  } catch (error) {
    console.error('Preference error:', error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

memoryRouter.get('/all/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { items, total, source, log } = await listAllUserMemories(userId);
    res.json({ items, total, source, tenant: process.env.HYDRA_TENANT_ID, log });
  } catch (error) {
    console.error('List memories error:', error);
    res.status(500).json({ error: 'Failed to list HydraDB memories' });
  }
});

memoryRouter.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const forgetMode = req.query.forgetMode === 'true';
    const { chunks, log } = await recallPreferences(
      userId,
      'user patterns emotions meditation preferences what works calm stacks',
      forgetMode,
    );
    res.json({ insights: chunks, log });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/** Begin meditation: stack + context from HydraDB only (no LLM). */
memoryRouter.post('/start-from-memory', async (req, res) => {
  try {
    const { userId, forgetMode = false, emotionLabel } = req.body as {
      userId: string;
      forgetMode?: boolean;
      emotionLabel?: string;
    };

    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    const { insights, recalledSessions, logs } = await recallForAgent(
      userId,
      emotionLabel,
      forgetMode,
    );

    const { stack, session } = resolveStackFromMemory(
      recalledSessions,
      insights,
      emotionLabel,
    );

    if (!stack || !session) {
      const label = emotionLabel?.trim() || 'calm';
      res.json({
        ok: true,
        freshStart: true,
        stack: FRESH_START_STACK,
        preEmotion: emotionCheckInFromLabel(label),
        reason: 'no_memory',
        recalledSessions: recalledSessions.slice(0, 3),
        memoryInsights: insights.slice(0, 6).map((i) => ({ text: i.text })),
        logs,
      });
      return;
    }

    res.json({
      ok: true,
      stack,
      preEmotion: emotionCheckInFromLabel(session.preEmotion),
      recalledSession: session,
      memoryInsights: insights.slice(0, 6).map((i) => ({ text: i.text })),
      logs,
    });
  } catch (error) {
    console.error('Start from memory error:', error);
    res.status(500).json({ error: 'Failed to resolve session from memory' });
  }
});
