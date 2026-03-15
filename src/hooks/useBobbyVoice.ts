// ============================================================
// useBobbyVoice — Hook that orchestrates Bobby's vocal presence
// Manages: ElevenLabs API calls, IndexedDB caching, AudioContext + AnalyserNode
// Returns: speak(), stop(), isSpeaking, analyser (for VoiceOrb)
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

// ---- IndexedDB cache for audio blobs (30min TTL) ----

const DB_NAME = 'bobby_voice_cache';
const STORE_NAME = 'audio';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'v_' + Math.abs(hash).toString(36);
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedAudio(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (result && (Date.now() - result.timestamp) < CACHE_TTL) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function setCachedAudio(key: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, data, timestamp: Date.now() });
  } catch { /* silent */ }
}

// ---- Hook ----

export interface BobbyVoiceState {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
}

export function useBobbyVoice(): BobbyVoiceState {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();

    const cacheKey = hashText(text);

    // Try cache first
    let audioData = await getCachedAudio(cacheKey);

    if (!audioData) {
      // Fetch from ElevenLabs via our proxy
      try {
        const res = await fetch('/api/bobby-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          console.warn('Bobby voice unavailable:', res.status);
          return;
        }

        audioData = await res.arrayBuffer();
        // Cache for next time
        await setCachedAudio(cacheKey, audioData);
      } catch (err) {
        console.warn('Bobby voice error:', err);
        return;
      }
    }

    // Create blob URL and play
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;

    // Create or reuse audio element
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    audio.src = url;
    setAudioElement(audio);

    // Set up AudioContext + AnalyserNode for the visualizer
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      // Only create source once per audio element
      if (!sourceRef.current) {
        const source = ctx.createMediaElementSource(audio);
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 64;
        source.connect(analyserNode);
        analyserNode.connect(ctx.destination);
        sourceRef.current = source;
        setAnalyser(analyserNode);
      }
    } catch (err) {
      console.warn('AudioContext setup failed:', err);
      // Still play audio even if visualizer fails
    }

    // Play
    setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    audio.onerror = () => {
      setIsSpeaking(false);
    };

    try {
      await audio.play();
    } catch (err) {
      console.warn('Audio play failed (user gesture required?):', err);
      setIsSpeaking(false);
    }
  }, [stop]);

  return { speak, stop, isSpeaking, analyser, audioElement };
}
