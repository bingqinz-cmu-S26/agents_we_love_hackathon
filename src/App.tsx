import { useCallback, useEffect, useState } from 'react';
import type {
  AgentResponse,
  ApiLogEntry,
  AppState,
  CalmStack,
  ChatMessage,
  EmotionCheckIn,
  MemoryInsight,
  RecalledSession,
  SessionRecord,
  UserProfile,
} from './types';
import { getUserId } from './types';
import { apiChat, apiHealth, apiListMemories, apiOnboarding, apiRecallInsights, apiSaveSession, apiSeedJourney, apiStartFromMemory } from './lib/api';
import { stackHintText } from './lib/stackHint';
import { pickBeginStack } from './lib/beginMeditation';
import { FRESH_START_MESSAGES, FRESH_START_STACK } from './lib/freshStart';
import { emotionCheckInFromLabel } from './lib/emotion';
import { unlockSessionAudio } from './lib/sessionAudio';
import { applyDemoHydraProfile } from './lib/demoProfile';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import {
  JASON_INSIGHTS,
  jasonSessionTimeline,
  type MultimodalDayLog,
} from './data/mockJasonHistory';
import { Onboarding } from './components/Onboarding';
import { ChatPanel } from './components/ChatPanel';
import { SessionView } from './components/SessionView';
import { ApiLogPanel } from './components/ApiLogPanel';
import { HydraMemoryDump } from './components/HydraMemoryDump';
import { PresenceHome } from './components/PresenceHome';
import { JourneyPanel, SessionDetailCard } from './components/JourneyPanel';
import { GlassCard } from './components/PresenceShell';
import { MoodMeter } from './components/MoodMeter';

type View = 'home' | 'session' | 'debrief';

const DEFAULT_CALM_STACK: CalmStack = FRESH_START_STACK;

const DEMO_PRE_EMOTION: EmotionCheckIn = {
  label: 'anxious',
  quadrant: 'red',
  energy: 0.85,
  pleasantness: 0.2,
  phase: 'pre',
  timestamp: new Date().toISOString(),
};

function loadTimeline(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem('still_timeline') ?? '[]');
  } catch {
    return [];
  }
}

function saveTimeline(timeline: SessionRecord[]) {
  localStorage.setItem('still_timeline', JSON.stringify(timeline));
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('still_profile');
    if (stored) return JSON.parse(stored);
    return { userId: getUserId(), onboardingComplete: false };
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPreEmotion, setCurrentPreEmotion] = useState<EmotionCheckIn>();
  const [suggestedStack, setSuggestedStack] = useState<CalmStack>();
  const [activeSession, setActiveSession] = useState<AppState['activeSession']>();
  const [timeline, setTimeline] = useState<SessionRecord[]>(loadTimeline);
  const [memoryInsights, setMemoryInsights] = useState<MemoryInsight[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [forgetMode, setForgetMode] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionCheckIn>();
  const [health, setHealth] = useState<{
    hydradb: boolean;
    nebius: boolean;
    nebiusModel?: string;
    demoUserId?: string;
    demoDisplayName?: string;
  }>();
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [lastRecalled, setLastRecalled] = useState<AgentResponse['recalledSessions']>();
  const [pendingStartAfterMood, setPendingStartAfterMood] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedJourneyLog, setSelectedJourneyLog] = useState<MultimodalDayLog | null>(null);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [homeMessage, setHomeMessage] = useState("I'm here.");
  const [homeSubtitle, setHomeSubtitle] = useState('Tap the orb and tell me how you feel.');
  const [stackHint, setStackHint] = useState<string | undefined>();
  const [agentModel, setAgentModel] = useState<string>();
  const [usedFallback, setUsedFallback] = useState(false);
  const [beginLoading, setBeginLoading] = useState(false);
  const [memoryDump, setMemoryDump] = useState<{
    items: Array<{ id?: string; text?: string; title?: string }>;
    total: number;
    source: string;
    tenant?: string;
  } | null>(null);
  const [memoryDumpLoading, setMemoryDumpLoading] = useState(false);

  useEffect(() => {
    apiHealth()
      .then((h) => {
        setHealth(h);
        if (h.demoUserId) {
          const next = applyDemoHydraProfile(h.demoUserId, h.demoDisplayName);
          setProfile(next);
          setDemoLoaded(true);
        }
      })
      .catch(() => setHealth({ hydradb: false, nebius: false }))
      .finally(() => setBooting(false));
  }, []);

  const refreshMemory = useCallback(async () => {
    try {
      const data = await apiRecallInsights(profile.userId, forgetMode);
      setMemoryInsights(data.insights ?? []);
      if (data.log) setApiLogs((prev) => [data.log, ...prev].slice(0, 20));
    } catch {
      /* ignore */
    }
  }, [profile.userId, forgetMode]);

  const prefetchMemoryStack = useCallback(
    async (emotionLabel?: string) => {
      if (forgetMode) return;
      try {
        const data = await apiStartFromMemory(profile.userId, { forgetMode, emotionLabel });
        if (data.logs) setApiLogs((prev) => [...data.logs, ...prev].slice(0, 30));
        if (data.ok && data.stack) {
          setSuggestedStack(data.stack);
          setStackHint(stackHintText(data.stack, !data.freshStart, Boolean(data.freshStart)));
          if (data.recalledSession) setLastRecalled([data.recalledSession]);
          if (data.preEmotion) setCurrentPreEmotion(data.preEmotion);
          if (data.freshStart && timeline.length === 0) {
            setHomeMessage(FRESH_START_MESSAGES.title);
            setHomeSubtitle(FRESH_START_MESSAGES.subtitle);
          }
        } else {
          setSuggestedStack(FRESH_START_STACK);
          setStackHint(stackHintText(FRESH_START_STACK, false, true));
          if (timeline.length === 0) {
            setHomeMessage(FRESH_START_MESSAGES.title);
            setHomeSubtitle(FRESH_START_MESSAGES.subtitle);
          }
        }
      } catch {
        /* no memory yet */
      }
    },
    [profile.userId, forgetMode, timeline.length],
  );

  useEffect(() => {
    if (profile.onboardingComplete) refreshMemory();
  }, [profile.onboardingComplete, refreshMemory]);

  useEffect(() => {
    if (profile.onboardingComplete && !forgetMode) {
      void prefetchMemoryStack();
    }
  }, [profile.onboardingComplete, forgetMode, prefetchMemoryStack]);

  useEffect(() => {
    if (profile.onboardingComplete && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Welcome back. How are you arriving today — in your body, not just in words?",
        },
      ]);
    }
  }, [profile.onboardingComplete, messages.length]);

  const handleOnboarding = async (spiritualTone: string, displayName?: string) => {
    const next = { ...profile, spiritualTone, displayName, onboardingComplete: true };
    setProfile(next);
    localStorage.setItem('still_profile', JSON.stringify(next));
    const result = await apiOnboarding(profile.userId, spiritualTone, displayName);
    if (result.log) setApiLogs((prev) => [result.log, ...prev]);
    await refreshMemory();
  };

  const startSession = useCallback(
    (stack: CalmStack, preEmotion?: EmotionCheckIn, recalledSession?: RecalledSession) => {
      unlockSessionAudio();
      const emotion =
        preEmotion ??
        currentPreEmotion ??
        selectedEmotion ??
        emotionCheckInFromLabel(recalledSession?.preEmotion ?? 'calm');
      setActiveSession({
        stack,
        preEmotion: emotion,
        startedAt: new Date().toISOString(),
        recalledSession,
      });
      setView('session');
    },
    [currentPreEmotion, selectedEmotion],
  );

  const sendMessage = useCallback(
    async (text: string): Promise<string | undefined> => {
      const userMsg: ChatMessage = { role: 'user', content: text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setLoading(true);

      const updateHome = (reply: string, stack?: CalmStack, fromMemory = false) => {
        const short = reply.split(/(?<=[.!?])\s/)[0] || reply;
        setHomeMessage(short.replace(/\*/g, ''));
        if (stack) {
          setStackHint(stackHintText(stack, fromMemory));
          setHomeSubtitle('Take your time.');
        }
      };

      try {
        const response: AgentResponse = await apiChat({
          userId: profile.userId,
          messages: nextMessages.filter((m) => m.role !== 'system'),
          latestMessage: text,
          forgetMode,
          spiritualTone: profile.spiritualTone,
          conversationEmotion: currentPreEmotion?.label,
          selectedEmotion: selectedEmotion
            ? { label: selectedEmotion.label, quadrant: selectedEmotion.quadrant }
            : undefined,
        });

        if (response.mappedEmotion) setCurrentPreEmotion(response.mappedEmotion);
        const stack = response.suggestedStack;
        if (stack) setSuggestedStack(stack);
        if (response.recalledSessions?.length) setLastRecalled(response.recalledSessions);
        if (response.apiLogs) setApiLogs((prev) => [...response.apiLogs!, ...prev].slice(0, 30));
        if (response.memoryInsights) setMemoryInsights(response.memoryInsights);
        if (response.model) setAgentModel(response.model);
        setUsedFallback(Boolean(response.usedFallback));

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.message,
          recalledFrom: response.recalledSessions?.[0],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        updateHome(response.message, stack, (response.recalledSessions?.length ?? 0) > 0);

        if (response.startSession && stack) {
          startSession(
            stack,
            response.mappedEmotion ?? currentPreEmotion ?? selectedEmotion,
            response.recalledSessions?.[0],
          );
        }
        return response.message;
      } catch (err) {
        console.error('Chat failed:', err);
        const stack = suggestedStack ?? DEFAULT_CALM_STACK;
        setSuggestedStack(stack);
        const fallback = `I'm here. ${stackHintText(stack, demoLoaded)}`;
        setMessages((prev) => [...prev, { role: 'assistant', content: fallback }]);
        updateHome(fallback, stack, demoLoaded);
        return fallback;
      } finally {
        setLoading(false);
        setSelectedEmotion(undefined);
      }
    },
    [
      messages,
      profile.userId,
      profile.spiritualTone,
      forgetMode,
      selectedEmotion,
      currentPreEmotion,
      suggestedStack,
      demoLoaded,
      startSession,
    ],
  );

  const handleVoiceTranscript = useCallback(
    async (text: string) => sendMessage(text),
    [sendMessage],
  );

  const { voiceState, startListening, supported: voiceSupported } = useVoiceAgent(handleVoiceTranscript);

  const beginMeditation = async (emotionOverride?: EmotionCheckIn) => {
    unlockSessionAudio();

    if (forgetMode) {
      setHomeSubtitle('Forget mode is on — turn it off in the header to use your memories.');
      return;
    }

    setBeginLoading(true);
    const emotionLabel =
      emotionOverride?.label ?? currentPreEmotion?.label ?? selectedEmotion?.label;

    const resolveEmotion = (
      recalled?: RecalledSession,
      apiPre?: EmotionCheckIn,
    ): EmotionCheckIn =>
      emotionOverride ??
      apiPre ??
      currentPreEmotion ??
      selectedEmotion ??
      (recalled ? emotionCheckInFromLabel(recalled.preEmotion) : undefined) ??
      emotionCheckInFromLabel(emotionLabel ?? 'calm');

    try {
      const data = await apiStartFromMemory(profile.userId, {
        forgetMode,
        emotionLabel,
      });

      if (data.logs) setApiLogs((prev) => [...data.logs, ...prev].slice(0, 30));
      if (data.memoryInsights) setMemoryInsights(data.memoryInsights);

      if (data.ok && data.stack) {
        setSuggestedStack(data.stack);
        setStackHint(stackHintText(data.stack, Boolean(data.recalledSession), Boolean(data.freshStart)));
        if (data.recalledSession) setLastRecalled([data.recalledSession]);
        const emotion = resolveEmotion(data.recalledSession, data.preEmotion);
        startSession(data.stack, emotion, data.recalledSession);
        if (!data.freshStart) {
          setHomeSubtitle('Take your time.');
        }
        return;
      }

      const fallback = pickBeginStack(DEFAULT_CALM_STACK, suggestedStack, lastRecalled, timeline);
      const recalled =
        data.recalledSession ??
        lastRecalled?.[0] ??
        fallback.recalled ??
        (data.recalledSessions?.[0] as RecalledSession | undefined);

      setSuggestedStack(fallback.stack);
      setStackHint(stackHintText(fallback.stack, Boolean(recalled)));
      if (recalled) setLastRecalled([recalled]);

      startSession(fallback.stack, resolveEmotion(recalled), recalled);

      if (data.reason === 'no_memory' && !recalled && timeline.length === 0) {
        setHomeSubtitle('Using a gentle default stack — load demo history for memory-guided sessions.');
      } else {
        setHomeSubtitle('Take your time.');
      }
    } catch (err) {
      console.error('Begin from memory failed:', err);
      const fallback = pickBeginStack(DEFAULT_CALM_STACK, suggestedStack, lastRecalled, timeline);
      const recalled = lastRecalled?.[0] ?? fallback.recalled;
      startSession(
        fallback.stack,
        resolveEmotion(recalled),
        recalled,
      );
      setHomeSubtitle('Memory API unreachable — starting with your last known calm stack.');
    } finally {
      setBeginLoading(false);
    }
  };

  const completeSession = async (data: {
    postEmotion: EmotionCheckIn;
    hrStart?: number;
    hrEnd?: number;
    rating: number;
    userNote?: string;
    durationSec: number;
  }) => {
    if (!activeSession) return;

    const calmScore =
      data.hrStart && data.hrEnd
        ? Math.round(((data.hrStart - data.hrEnd) / data.hrStart) * 100)
        : undefined;

    const session: SessionRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      preEmotion: activeSession.preEmotion,
      postEmotion: data.postEmotion,
      stack: activeSession.stack,
      hrStart: data.hrStart,
      hrEnd: data.hrEnd,
      calmScore,
      rating: data.rating,
      userNote: data.userNote,
      outcome: (data.rating >= 4 ? 'effective' : data.rating >= 3 ? 'partial' : 'ineffective') as SessionRecord['outcome'],
      durationSec: data.durationSec,
    };

    const result = await apiSaveSession(profile.userId, session);
    if (result.log) setApiLogs((prev) => [result.log, ...prev]);

    const nextTimeline = [session, ...timeline];
    setTimeline(nextTimeline);
    saveTimeline(nextTimeline);
    setActiveSession(undefined);
    setView('home');
    await refreshMemory();

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `Saved. You moved from ${session.preEmotion.label} to ${data.postEmotion.label}${calmScore ? ` — your body eased a little` : ''}. I'll remember what helped.`,
      },
    ]);
  };

  const handleEmotionPick = (emotion: EmotionCheckIn) => {
    const withMeta = { ...emotion, phase: 'pre' as const, timestamp: new Date().toISOString() };
    setSelectedEmotion(withMeta);
    setCurrentPreEmotion(withMeta);
    setShowMoodPicker(false);

    if (pendingStartAfterMood) {
      setPendingStartAfterMood(false);
      void beginMeditation(withMeta);
      return;
    }

    void sendMessage(`I'm feeling ${emotion.label}.`);
  };

  const loadJasonDemo = async () => {
    const sessions = jasonSessionTimeline();
    setTimeline(sessions);
    saveTimeline(sessions);
    setMemoryInsights(JASON_INSIGHTS.map((text) => ({ text })));
    setDemoLoaded(true);
    setSuggestedStack(DEFAULT_CALM_STACK);
    setCurrentPreEmotion(DEMO_PRE_EMOTION);
    try {
      const result = await apiSeedJourney(profile.userId);
      if (result.logs) setApiLogs((prev) => [...result.logs, ...prev].slice(0, 40));
      else if (result.log) setApiLogs((prev) => [result.log, ...prev]);
      await refreshMemory();
      await prefetchMemoryStack();
    } catch {
      /* local demo still works */
    }
    setMessages([
      {
        role: 'assistant',
        content:
          "Jason's journey is here — scents, sounds, light. When you're anxious, sandalwood and warm glow tended to help. How are you arriving today?",
      },
    ]);
    setShowJourney(true);
  };

  const agentMessage = homeMessage;
  const agentSubtitle = homeSubtitle;

  useEffect(() => {
    if (!showLogs) return;
    setMemoryDumpLoading(true);
    apiListMemories(profile.userId)
      .then((data) => {
        setMemoryDump({
          items: data.items ?? [],
          total: data.total ?? 0,
          source: data.source ?? 'unknown',
          tenant: data.tenant,
        });
        if (data.log) setApiLogs((prev) => [data.log, ...prev].slice(0, 30));
      })
      .catch(() => setMemoryDump(null))
      .finally(() => setMemoryDumpLoading(false));
  }, [showLogs, profile.userId]);

  if (booting) {
    return (
      <div className="presence-page min-h-screen flex items-center justify-center text-white/40 text-sm font-light">
        Presence…
      </div>
    );
  }

  if (!profile.onboardingComplete) {
    return <Onboarding onComplete={handleOnboarding} health={health} />;
  }

  if (view === 'session' && activeSession) {
    return (
      <SessionView
        session={activeSession}
        minutesToday={Math.min(60, timeline.length * 3 + 3)}
        onComplete={completeSession}
        onExit={() => {
          setActiveSession(undefined);
          setView('home');
        }}
      />
    );
  }

  return (
    <div className="presence-page text-white min-h-screen relative">
      <div className="presence-radial" />

      <header className="relative z-20 max-w-xl mx-auto px-6 sm:px-8 pt-5 pb-2">
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-4 py-2.5"
        >
          <p className="text-sm font-light text-white/85 shrink-0">Presence</p>
          <nav className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowJourney(true)}
              className="text-[11px] px-2.5 py-1 rounded-full text-white/55 hover:text-white/90 hover:bg-white/5"
            >
              Journey
            </button>
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="text-[11px] px-2.5 py-1 rounded-full text-white/55 hover:text-white/90 hover:bg-white/5"
            >
              Agent
            </button>
            <label className="hidden sm:flex items-center gap-1 text-[10px] text-white/35 px-2">
              <input
                type="checkbox"
                checked={forgetMode}
                onChange={(e) => setForgetMode(e.target.checked)}
                className="scale-90"
              />
              forget
            </label>
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className={`text-[10px] px-2 py-1 rounded-full transition ${
                showLogs
                  ? 'text-white/80 bg-white/10'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              logs
            </button>
          </nav>
        </div>
      </header>

      <PresenceHome
        displayName={profile.displayName}
        message={agentMessage.length > 120 ? "I'm here." : agentMessage}
        subtitle={agentSubtitle}
        voiceState={voiceState}
        voiceSupported={voiceSupported}
        onOrbPress={startListening}
        onBegin={() => {
          unlockSessionAudio();
          void beginMeditation();
        }}
        beginLoading={beginLoading}
        onOpenJourney={() => setShowJourney(true)}
        onLoadDemo={() => void loadJasonDemo()}
        stackHint={stackHint}
      />

      <p className="relative z-10 text-center pb-6 tracking-[5px] text-[10px] text-white/25 select-none">
        P R E S E N C E
      </p>

      {demoLoaded && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <GlassCard className="p-4">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Presence remembers</p>
            <ul className="space-y-1 text-sm text-white/70 font-light">
              {(memoryInsights.length ? memoryInsights.map((i) => i.text) : JASON_INSIGHTS).slice(0, 4).map((t) => (
                <li key={t}>· {t}</li>
              ))}
            </ul>
          </GlassCard>
        </div>
      )}

      {showJourney && (
        <div className="fixed inset-0 z-40 glass-overlay flex justify-end">
          <div className="w-full max-w-lg h-full overflow-y-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light">Journey</h2>
              <button type="button" onClick={() => setShowJourney(false)} className="text-white/50 text-sm">
                Close
              </button>
            </div>
            {selectedJourneyLog ? (
              <div className="space-y-4">
                <SessionDetailCard log={selectedJourneyLog} />
                <button
                  type="button"
                  onClick={() => setSelectedJourneyLog(null)}
                  className="text-sm text-white/50"
                >
                  ← Back to timeline
                </button>
              </div>
            ) : (
              <JourneyPanel onSelectSession={(log) => setSelectedJourneyLog(log)} />
            )}
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 z-40 glass-overlay flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col">
            <GlassCard className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                <span className="text-sm font-light">Talk to Presence</span>
                <button type="button" onClick={() => setShowChat(false)} className="text-white/50 text-sm">
                  Close
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ChatPanel
                  messages={messages}
                  onSend={(t) => void sendMessage(t)}
                  loading={loading}
                  lastRecalled={lastRecalled}
                  embedded
                  agentModel={agentModel}
                  usedFallback={usedFallback}
                />
              </div>
              <div className="p-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowMoodPicker(!showMoodPicker)}
                  className="w-full py-2 rounded-full border border-white/15 text-xs text-white/70"
                >
                  {showMoodPicker ? 'Hide mood meter' : 'Pick emotion'}
                </button>
                {showMoodPicker && <MoodMeter onSelect={handleEmotionPick} phase="pre" />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void loadJasonDemo()}
                    className="flex-1 py-2 rounded-full border border-amber-500/30 text-amber-200/80 text-xs"
                  >
                    Load Jason demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      unlockSessionAudio();
                      void beginMeditation();
                    }}
                    disabled={beginLoading}
                    className="flex-1 py-2 rounded-full bg-white text-black text-xs font-medium disabled:opacity-60"
                  >
                    {beginLoading ? 'Recalling…' : 'Start meditation'}
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {showLogs && (
        <div
          className="fixed inset-0 z-40 glass-overlay flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setShowLogs(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#080808]/95 backdrop-blur-xl shadow-2xl flex flex-col max-h-[min(70vh,520px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 shrink-0">
              <span className="text-sm font-light text-white/90">Memory logs</span>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                className="text-xs text-white/45 hover:text-white/80"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              <details className="text-[10px] text-white/45 leading-relaxed group">
                <summary className="cursor-pointer text-white/55 hover:text-white/75 list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">›</span>
                  How Presence works
                </summary>
                <div className="mt-2 pl-3 space-y-0.5 border-l border-white/10">
                  <p>Speak → HydraDB recall → Nebius ({health?.nebiusModel ?? 'LLM'}) → session</p>
                </div>
              </details>
              <HydraMemoryDump
                userId={profile.userId}
                tenant={memoryDump?.tenant}
                source={memoryDump?.source}
                total={memoryDump?.total}
                items={memoryDump?.items}
                loading={memoryDumpLoading}
              />
              <p className="text-[10px] text-white/35 uppercase tracking-widest">Recent API calls</p>
              <ApiLogPanel logs={apiLogs} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
