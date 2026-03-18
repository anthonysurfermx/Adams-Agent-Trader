// ============================================================
// TradingModeSelector — Onboarding: choose how Bobby trades
// Paper Trading / Human Confirms / Full AI Execution
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TradingMode = 'paper' | 'confirm' | 'auto';

interface TradingModeSelectorProps {
  onSelect: (mode: TradingMode) => void;
  language?: string;
}

const MODES = [
  {
    id: 'paper' as TradingMode,
    icon: '📝',
    titleEs: 'Paper Trading',
    titleEn: 'Paper Trading',
    descEs: 'Bobby analiza y recomienda trades simulados. Sin dinero real. Perfecto para aprender.',
    descEn: 'Bobby analyzes and recommends simulated trades. No real money. Perfect for learning.',
    color: '#3388ff',
    tag: 'SAFE',
  },
  {
    id: 'confirm' as TradingMode,
    icon: '🤝',
    titleEs: 'Decisión Humana',
    titleEn: 'Human Confirms',
    descEs: 'Bobby debate y recomienda. Tú confirmas cada trade antes de ejecutar. Dinero real, control total.',
    descEn: 'Bobby debates and recommends. You confirm every trade before execution. Real money, full control.',
    color: '#ffaa00',
    tag: 'BALANCED',
  },
  {
    id: 'auto' as TradingMode,
    icon: '🤖',
    titleEs: 'Ejecución con AI',
    titleEn: 'AI Execution',
    descEs: 'Bobby debate, decide y ejecuta automáticamente cuando la convicción es alta. Sin intervención humana.',
    descEn: 'Bobby debates, decides and executes automatically when conviction is high. No human intervention.',
    color: '#00ff88',
    tag: 'AUTONOMOUS',
  },
];

export default function TradingModeSelector({ onSelect, language = 'es' }: TradingModeSelectorProps) {
  const [selected, setSelected] = useState<TradingMode | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const isEs = language === 'es';

  // Check if mode was already set
  useEffect(() => {
    const saved = localStorage.getItem('bobby_trading_mode');
    if (saved === 'paper' || saved === 'confirm' || saved === 'auto') {
      onSelect(saved);
      setShowSelector(false);
    }
  }, [onSelect]);

  const handleSelect = (mode: TradingMode) => {
    setSelected(mode);
    setTimeout(() => {
      localStorage.setItem('bobby_trading_mode', mode);
      onSelect(mode);
      setShowSelector(false);
    }, 600);
  };

  if (!showSelector) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ maxWidth: 500, width: '90vw', padding: 24 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
            <h2 style={{ color: '#fff', fontSize: 20, margin: '0 0 8px', fontWeight: 700 }}>
              {isEs ? '¿Cómo quieres operar con Bobby?' : 'How do you want to trade with Bobby?'}
            </h2>
            <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
              {isEs ? 'Puedes cambiar esto después en configuración' : 'You can change this later in settings'}
            </p>
          </div>

          {/* Mode cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MODES.map((mode, i) => (
              <motion.button
                key={mode.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => handleSelect(mode.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px',
                  background: selected === mode.id ? `${mode.color}22` : '#ffffff08',
                  border: `1px solid ${selected === mode.id ? mode.color : '#333'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  transform: selected === mode.id ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: 32 }}>{mode.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
                      {isEs ? mode.titleEs : mode.titleEn}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                      background: `${mode.color}33`, color: mode.color,
                      letterSpacing: 1,
                    }}>
                      {mode.tag}
                    </span>
                  </div>
                  <span style={{ color: '#888', fontSize: 11, lineHeight: 1.4 }}>
                    {isEs ? mode.descEs : mode.descEn}
                  </span>
                </div>
                {selected === mode.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: mode.color, color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
