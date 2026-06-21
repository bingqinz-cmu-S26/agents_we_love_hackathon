import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ambienceForMusic,
  getSharedSessionAudio,
  pauseSharedSessionAudio,
  playSharedSessionAudio,
} from '../lib/sessionAudio';

const TARGET_VOLUME = 0.48;
const FADE_MS = 2500;

export function useSessionAmbience(musicKey: string, active: boolean) {
  const fadeRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const ambience = ambienceForMusic(musicKey);

  const clearFade = () => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  const fadeTo = useCallback((audio: HTMLAudioElement, target: number, onDone?: () => void) => {
    clearFade();
    const start = audio.volume;
    const steps = 20;
    const stepMs = FADE_MS / steps;
    let i = 0;
    fadeRef.current = window.setInterval(() => {
      i += 1;
      audio.volume = start + (target - start) * (i / steps);
      if (i >= steps) {
        clearFade();
        audio.volume = target;
        onDone?.();
      }
    }, stepMs);
  }, []);

  const tryPlay = useCallback(() => {
    if (!active || !ambience || muted) return;

    setLoading(true);
    void playSharedSessionAudio(ambience.src, () => {
      setPlaying(false);
      setBlocked(true);
      setLoading(false);
    }).then((audio) => {
      setLoading(false);
      if (!audio) return;
      setPlaying(true);
      setBlocked(false);
      fadeTo(audio, TARGET_VOLUME);
    });
  }, [active, ambience, muted, fadeTo]);

  useEffect(() => {
    if (!active || !ambience) {
      const audio = getSharedSessionAudio();
      if (!audio.paused) {
        fadeTo(audio, 0, () => {
          pauseSharedSessionAudio();
          setPlaying(false);
        });
      }
      return;
    }

    if (muted) {
      const audio = getSharedSessionAudio();
      fadeTo(audio, 0, () => pauseSharedSessionAudio());
      setPlaying(false);
      return;
    }

    tryPlay();

    return () => {
      clearFade();
    };
  }, [active, ambience, muted, tryPlay, fadeTo]);

  useEffect(() => {
    if (!active || !blocked) return;

    const onPointer = () => {
      tryPlay();
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [active, blocked, tryPlay]);

  useEffect(() => {
    return () => {
      clearFade();
      const audio = getSharedSessionAudio();
      fadeTo(audio, 0, () => pauseSharedSessionAudio());
    };
  }, [fadeTo]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const audio = getSharedSessionAudio();
      if (next) {
        fadeTo(audio, 0, () => pauseSharedSessionAudio());
        setPlaying(false);
      } else {
        tryPlay();
      }
      return next;
    });
  }, [fadeTo, tryPlay]);

  return {
    ambience,
    muted,
    playing,
    blocked,
    loading,
    toggleMute,
    retryPlay: tryPlay,
  };
};
