import type { ReactNode } from 'react';

export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PresenceOrb({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const dim = size === 'lg' ? 'w-[170px] h-[170px]' : 'w-[120px] h-[120px]';
  return (
    <div
      className={`${dim} rounded-full border border-white/[0.18] presence-orb shadow-[0_0_80px_rgba(255,255,255,0.08),inset_0_0_40px_rgba(255,255,255,0.04)]`}
    />
  );
}
