import { MUSIC_OPTIONS } from '../types';

export interface SessionAmbience {
  src: string;
  label: string;
}

/** 90s ocean loop (~1.4MB) — original 66MB m4a was too slow to load for web playback */
export const SESSION_AMBIENCE_SRC = '/audio/ocean-loop.mp3';
export const SESSION_AMBIENCE_FALLBACK = '/audio/stream-ambience.mp3';
export const SESSION_AMBIENCE_LABEL = 'Ocean';

let sharedAudio: HTMLAudioElement | null = null;

export function getSharedSessionAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.loop = true;
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

export function waitForCanPlay(audio: HTMLAudioElement, timeoutMs = 12000): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('audio load timeout'));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error('audio load error'));
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('error', onError);
    };

    audio.addEventListener('canplay', onReady);
    audio.addEventListener('error', onError);
  });
}

function primeAudioSrc(audio: HTMLAudioElement, src: string): void {
  const resolved = new URL(src, window.location.origin).href;
  if (audio.src !== resolved) {
    audio.src = src;
    audio.load();
  }
}

/** Call synchronously on user click — unlocks the shared element before async work */
export function unlockSessionAudio(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      void ctx.resume();
    }
  } catch {
    /* ignore */
  }

  const audio = getSharedSessionAudio();
  primeAudioSrc(audio, SESSION_AMBIENCE_SRC);
  audio.volume = 0.02;

  audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    })
    .catch(() => {
      primeAudioSrc(audio, SESSION_AMBIENCE_FALLBACK);
      audio.volume = 0.02;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0;
        })
        .catch(() => {});
    });
}

export async function playSharedSessionAudio(
  src: string,
  onBlocked?: () => void,
): Promise<HTMLAudioElement | null> {
  const audio = getSharedSessionAudio();
  primeAudioSrc(audio, src);

  try {
    await waitForCanPlay(audio);
    audio.volume = 0;
    await audio.play();
    return audio;
  } catch {
    if (src !== SESSION_AMBIENCE_FALLBACK) {
      try {
        primeAudioSrc(audio, SESSION_AMBIENCE_FALLBACK);
        await waitForCanPlay(audio);
        audio.volume = 0;
        await audio.play();
        return audio;
      } catch {
        onBlocked?.();
        return null;
      }
    }
    onBlocked?.();
    return null;
  }
}

export function pauseSharedSessionAudio(): void {
  const audio = sharedAudio;
  if (audio && !audio.paused) audio.pause();
}

/** Every meditation uses ocean sound unless the stack is silence. */
export function ambienceForMusic(musicKey: string): SessionAmbience | null {
  if (musicKey === 'silence') return null;

  const stackLabel = MUSIC_OPTIONS[musicKey]?.label;
  const label = stackLabel ? `${SESSION_AMBIENCE_LABEL} · ${stackLabel}` : SESSION_AMBIENCE_LABEL;

  return { src: SESSION_AMBIENCE_SRC, label };
}
