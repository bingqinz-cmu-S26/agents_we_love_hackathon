interface Item {
  id?: string;
  text?: string;
  title?: string;
}

interface Props {
  userId: string;
  tenant?: string;
  source?: string;
  total?: number;
  items?: Item[];
  loading?: boolean;
}

export function HydraMemoryDump({ userId, tenant, source, total, items, loading }: Props) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
      <div className="text-[10px] text-white/45 space-y-1">
        <p>
          <span className="text-white/55">userId</span>{' '}
          <code className="text-white/70">{userId}</code>
        </p>
        {tenant && (
          <p>
            <span className="text-white/55">tenant</span> <code className="text-white/60">{tenant}</code>
          </p>
        )}
        {source && (
          <p>
            <span className="text-white/55">store</span> {source} · {total ?? 0} records
          </p>
        )}
      </div>

      {loading && <p className="text-xs text-white/40">Loading HydraDB…</p>}

      {!loading && items && items.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item, i) => (
            <p key={item.id ?? i} className="text-[10px] text-white/65 leading-snug border-l border-white/10 pl-2">
              {item.text ?? item.title ?? '—'}
            </p>
          ))}
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <p className="text-xs text-white/40">No memories for this userId. Try Load demo history.</p>
      )}
    </div>
  );
}
