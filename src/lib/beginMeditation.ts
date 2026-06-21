import type { CalmStack, RecalledSession, SessionRecord } from '../types';

export function sessionRecordToRecalled(session: SessionRecord): RecalledSession {
  return {
    date: session.date,
    preEmotion: session.preEmotion.label,
    postEmotion: session.postEmotion?.label,
    stack: session.stack,
    hrStart: session.hrStart,
    hrEnd: session.hrEnd,
    rating: session.rating,
  };
}

export function pickBeginStack(
  defaultStack: CalmStack,
  suggestedStack?: CalmStack,
  lastRecalled?: RecalledSession[],
  timeline?: SessionRecord[],
): { stack: CalmStack; recalled?: RecalledSession } {
  if (suggestedStack) {
    return { stack: suggestedStack, recalled: lastRecalled?.[0] };
  }
  if (lastRecalled?.[0]?.stack) {
    return { stack: lastRecalled[0].stack, recalled: lastRecalled[0] };
  }
  if (timeline?.[0]) {
    return { stack: timeline[0].stack, recalled: sessionRecordToRecalled(timeline[0]) };
  }
  return { stack: defaultStack };
}
