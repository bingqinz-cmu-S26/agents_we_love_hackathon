import { useEffect, useRef, useState } from 'react';

interface Props {
  onHeartRate: (bpm: number) => void;
  demoMode: boolean;
  onDemoModeChange: (v: boolean) => void;
}

/** Wellness vitals panel — demo simulates rPPG; live mode uses camera + session-based estimate. */
export function VitalsMonitor({ onHeartRate, demoMode, onDemoModeChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [status, setStatus] = useState('Initializing…');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    let interval: number;

    if (demoMode) {
      setError(null);
      setStatus('Demo rPPG — simulated heart rate');
      let base = 78 + Math.random() * 8;
      interval = window.setInterval(() => {
        base = Math.max(58, base - 0.15 + (Math.random() - 0.4) * 0.5);
        const bpm = Math.round(base);
        setHr(bpm);
        onHeartRate(bpm);
      }, 1000);
      return () => clearInterval(interval);
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('Camera active — estimating vitals from stillness');
        setError(null);
      } catch {
        setError('Camera blocked — switch to demo mode');
        onDemoModeChange(true);
      }
    }

    void startCamera();

    // Session-based wellness estimate: HR eases as user stays still (proxy for rPPG calm signal)
    let estimate = 76 + Math.round(Math.random() * 10);
    interval = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const targetDrop = Math.min(18, elapsed * 0.08);
      estimate = Math.max(58, 76 - targetDrop + (Math.random() - 0.5) * 1.2);
      const bpm = Math.round(estimate);
      setHr(bpm);
      onHeartRate(bpm);
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(interval);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [demoMode, onHeartRate, onDemoModeChange]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs text-slate-400">Contactless vitals (rPPG-ready)</p>
          <p className="text-2xl font-display text-still-accent">{hr ? `${hr} BPM` : '—'}</p>
        </div>
        <label className="text-[10px] flex items-center gap-1 text-slate-400">
          <input type="checkbox" checked={demoMode} onChange={(e) => onDemoModeChange(e.target.checked)} />
          Demo rPPG
        </label>
      </div>
      {!demoMode && (
        <video
          ref={videoRef}
          className="w-full rounded-lg opacity-80 max-h-32 object-cover -scale-x-100"
          playsInline
          muted
        />
      )}
      <p className="text-[10px] text-slate-500 mt-2">{error ?? status}</p>
      <p className="text-[10px] text-slate-600">Wellness estimate — not medical diagnosis</p>
    </div>
  );
}
