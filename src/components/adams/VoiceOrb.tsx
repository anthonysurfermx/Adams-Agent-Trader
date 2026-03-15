// ============================================================
// VoiceOrb — Bobby's visual presence
// Pulses with voice frequency data via AnalyserNode
// Mood-reactive: green (confident), amber (cautious), red (defensive)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

type Mood = 'confident' | 'cautious' | 'defensive';

const MOOD_COLORS: Record<Mood, { core: string; glow: string; border: string; text: string }> = {
  confident: {
    core: 'bg-green-500',
    glow: 'bg-green-500',
    border: 'border-green-500/50',
    text: 'text-green-400',
  },
  cautious: {
    core: 'bg-amber-500',
    glow: 'bg-amber-500',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
  },
  defensive: {
    core: 'bg-red-500',
    glow: 'bg-red-500',
    border: 'border-red-500/50',
    text: 'text-red-400',
  },
};

interface VoiceOrbProps {
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  mood?: Mood;
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export function VoiceOrb({ analyser, isSpeaking, mood = 'confident', onToggleMute, isMuted }: VoiceOrbProps) {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef<number>(0);
  const colors = MOOD_COLORS[mood];

  useEffect(() => {
    if (!analyser || !isSpeaking) {
      setVolume(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setVolume(average / 128); // 0-2 range, typically 0-1
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isSpeaking]);

  return (
    <AnimatePresence>
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Orb container */}
          <div className="relative flex items-center justify-center w-20 h-20">
            {/* Outer glow — reacts to volume */}
            <motion.div
              animate={{
                scale: 1 + volume * 0.6,
                opacity: 0.15 + volume * 0.35,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={`absolute w-16 h-16 ${colors.glow} rounded-full blur-xl`}
            />

            {/* Mid ring */}
            <motion.div
              animate={{
                scale: 1 + volume * 0.3,
                opacity: 0.2 + volume * 0.3,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`absolute w-14 h-14 ${colors.glow} rounded-full blur-md opacity-20`}
            />

            {/* Core orb */}
            <motion.div
              animate={{ scale: 1 + volume * 0.15 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`relative z-10 w-12 h-12 bg-neutral-950 ${colors.border} border-2 rounded-full shadow-lg flex items-center justify-center cursor-pointer`}
              onClick={onToggleMute}
            >
              {/* Inner dot */}
              <motion.div
                animate={{
                  scale: 0.8 + volume * 0.4,
                  opacity: 0.6 + volume * 0.4,
                }}
                className={`w-2 h-2 ${colors.core} rounded-full`}
              />
            </motion.div>
          </div>

          {/* Status label */}
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-bold tracking-[2px] ${colors.text} uppercase`}>
              {isSpeaking ? 'speaking' : 'idle'}
            </span>
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
