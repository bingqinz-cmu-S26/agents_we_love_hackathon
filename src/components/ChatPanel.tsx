import { useRef, useState } from 'react';
import type { ChatMessage, RecalledSession } from '../types';
import { RecalledSessionCard } from './RecalledSessionDisplay';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  loading: boolean;
  lastRecalled?: RecalledSession[];
  embedded?: boolean;
  agentModel?: string;
  usedFallback?: boolean;
}

export function ChatPanel({ messages, onSend, loading, lastRecalled, embedded, agentModel, usedFallback }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div
      className={`flex flex-col ${embedded ? 'h-full min-h-0 bg-transparent border-0' : 'h-[480px] rounded-2xl border border-white/10 bg-white/[0.04]'}`}
    >
      {!embedded && (
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="font-light">Talk to Presence</h2>
          <p className="text-xs text-white/45">Recalls your journey via HydraDB</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-light ${
                m.role === 'user'
                  ? 'bg-white/15 text-white rounded-br-md'
                  : 'bg-white/[0.06] border border-white/10 text-white/85 rounded-bl-md'
              }`}
            >
              {m.content}
              {m.role === 'assistant' && m.recalledFrom && <RecalledSessionCard session={m.recalledFrom} />}
              {m.role === 'assistant' &&
                i === messages.length - 1 &&
                lastRecalled?.[0] &&
                !m.recalledFrom && <RecalledSessionCard session={lastRecalled[0]} />}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-white/40 animate-pulse">Recalling memories…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/10 space-y-2">
        {messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          !loading &&
          /want to try|ready when|start your session/i.test(messages[messages.length - 1].content) && (
            <div className="flex gap-2">
              <button
                onClick={() => onSend('Yes')}
                className="flex-1 py-2 rounded-full bg-white text-black text-xs font-medium"
              >
                Yes — start
              </button>
              <button
                onClick={() => onSend('Something different please')}
                className="flex-1 py-2 rounded-full border border-white/20 text-white/60 text-xs"
              >
                Different
              </button>
            </div>
          )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="How are you feeling?"
            className="flex-1 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/10 outline-none text-sm text-white placeholder:text-white/30"
          />
          <button
            onClick={submit}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            Send
          </button>
        </div>
        {agentModel && (
          <p className="text-[10px] text-white/25 text-center">
            {usedFallback ? 'Memory-backed fallback (Nebius unavailable)' : `Model: ${agentModel}`}
          </p>
        )}
      </div>
    </div>
  );
}
