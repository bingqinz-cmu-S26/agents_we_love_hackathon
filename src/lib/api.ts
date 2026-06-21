const API = '/api';

export async function apiChat(body: unknown) {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function apiSaveSession(userId: string, session: unknown) {
  const res = await fetch(`${API}/memory/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, session }),
  });
  if (!res.ok) throw new Error('Save session failed');
  return res.json();
}

export async function apiOnboarding(userId: string, spiritualTone: string, displayName?: string) {
  const res = await fetch(`${API}/memory/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, spiritualTone, displayName }),
  });
  if (!res.ok) throw new Error('Onboarding failed');
  return res.json();
}

export async function apiRecallInsights(userId: string, forgetMode: boolean) {
  const res = await fetch(`${API}/memory/insights/${userId}?forgetMode=${forgetMode}`);
  if (!res.ok) throw new Error('Recall failed');
  return res.json();
}

export async function apiSeedJourney(userId: string) {
  const res = await fetch(`${API}/memory/seed-journey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Seed journey failed');
  return res.json();
}

export async function apiSeedDemo(userId: string) {
  const res = await fetch(`${API}/memory/seed-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Seed demo failed');
  return res.json();
}

export async function apiStartFromMemory(
  userId: string,
  opts?: { forgetMode?: boolean; emotionLabel?: string },
) {
  const res = await fetch(`${API}/memory/start-from-memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      forgetMode: opts?.forgetMode ?? false,
      emotionLabel: opts?.emotionLabel,
    }),
  });
  if (!res.ok) throw new Error('Start from memory failed');
  return res.json();
}

export async function apiListMemories(userId: string) {
  const res = await fetch(`${API}/memory/all/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('List memories failed');
  return res.json();
}

export async function apiHealth() {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
