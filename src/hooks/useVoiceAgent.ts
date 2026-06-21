import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'unsupported';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    SpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function pickWarmVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const prefer = [
    'Samantha',
    'Karen',
    'Moira',
    'Google UK English Female',
    'Google US English',
    'Microsoft Zira',
    'Flo',
  ];
  for (const name of prefer) {
    const v = voices.find((voice) => voice.name.includes(name));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
}

/** Strip markdown-ish noise so TTS sounds human */
function textForSpeech(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/—/g, ', ')
    .replace(/–/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useVoiceAgent(onTranscript: (text: string) => Promise<string | void>) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>();
  const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => {
      voiceRef.current = pickWarmVoice();
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(textForSpeech(text));
    utter.rate = 0.84;
    utter.pitch = 0.94;
    utter.volume = 0.92;
    if (voiceRef.current) utter.voice = voiceRef.current;
    setVoiceState('speaking');
    utter.onend = () => setVoiceState('idle');
    utter.onerror = () => setVoiceState('idle');
    window.speechSynthesis.speak(utter);
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setVoiceState('unsupported');
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript.trim();
      if (!text) {
        setVoiceState('idle');
        return;
      }
      setVoiceState('thinking');
      try {
        const reply = await onTranscript(text);
        if (reply) speak(reply);
        else setVoiceState('idle');
      } catch {
        setVoiceState('idle');
      }
    };

    recognition.onerror = () => setVoiceState('idle');
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    setVoiceState('listening');
    recognition.start();
  }, [supported, onTranscript, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  useEffect(() => {
    if (!supported) setVoiceState('unsupported');
  }, [supported]);

  return { voiceState, startListening, stopListening, speak, supported };
}
