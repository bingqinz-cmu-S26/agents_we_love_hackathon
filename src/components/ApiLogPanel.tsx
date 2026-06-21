import type { ApiLogEntry } from '../types';

function extractContents(log: ApiLogEntry): string[] {
  if (log.contents?.length) return log.contents;
  const payload = log.payload as Record<string, unknown> | undefined;
  if (!payload) return [];

  if (Array.isArray(payload.memories)) {
    return payload.memories.filter((m): m is string => typeof m === 'string');
  }

  if (Array.isArray(payload.chunks)) {
    return payload.chunks
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && 'text' in c && typeof (c as { text: unknown }).text === 'string') {
          return (c as { text: string }).text;
        }
        return '';
      })
      .filter(Boolean);
  }

  return [];
}

export function ApiLogPanel({ logs }: { logs: ApiLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-xs text-white/40 font-light py-2">
        HydraDB logs appear after memory read or write.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log, i) => {
        const contents = extractContents(log);
        const hasContents = contents.length > 0;

        return (
          <div
            key={`${log.timestamp}-${i}`}
            className="text-[10px] font-mono rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex justify-between gap-2 mb-1">
              <span className={log.type === 'write' ? 'text-emerald-400/80' : 'text-cyan-300/70'}>
                {log.type.toUpperCase()}
              </span>
              <span className="text-white/30 tabular-nums shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-white/40 leading-snug">{log.endpoint}</p>
            <p className="text-white/55 mt-1 leading-snug">{log.summary}</p>

            {log.query && (
              <p className="text-white/40 mt-1.5 leading-snug">
                <span className="text-white/50">query</span>{' '}
                <span className="text-white/65">{log.query}</span>
              </p>
            )}

            {hasContents && (
              <div className="mt-2 space-y-1.5">
                <p className="text-white/45 uppercase tracking-wider text-[9px]">
                  {log.type === 'write' ? 'stored' : 'recalled'} ({contents.length})
                </p>
                {contents.map((text, j) => (
                  <div
                    key={j}
                    className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2 text-white/75 leading-relaxed whitespace-pre-wrap break-words font-sans text-[11px]"
                  >
                    <span className="text-white/35 font-mono text-[9px] mr-1.5">#{j + 1}</span>
                    {text}
                  </div>
                ))}
              </div>
            )}

            {!hasContents && log.payload != null && (
              <details className="mt-2">
                <summary className="cursor-pointer text-white/35 hover:text-white/55 text-[9px]">
                  raw payload
                </summary>
                <pre className="mt-1 text-[9px] text-white/45 overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
