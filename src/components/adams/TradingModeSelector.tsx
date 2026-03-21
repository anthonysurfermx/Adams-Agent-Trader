// ============================================================
// TradingModeSelector — "Welcome to the Kinetic Terminal"
// Stitch design: glass modal, risk disclaimer, mode cards
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type TradingMode = 'paper' | 'confirm' | 'auto';

interface TradingModeSelectorProps {
  onSelect: (mode: TradingMode) => void;
  language?: string;
  onInitVoice?: () => void; // Warm up audio context on "INITIALIZE AGENT"
}

const MODES = [
  {
    id: 'paper' as TradingMode,
    titleEs: 'Paper Trading',
    titleEn: 'Paper Trading',
    descEs: 'Entorno simulado para probar estrategias. Cero riesgo.',
    descEn: 'Simulated environment for strategy testing. Zero risk.',
    tag: 'SAFE',
    tagColor: '#3b82f6',
  },
  {
    id: 'confirm' as TradingMode,
    titleEs: 'Decisión Humana',
    titleEn: 'Human Confirms',
    descEs: 'Bobby identifica señales; tú autorizas cada ejecución.',
    descEn: 'Bobby identifies signals; you authorize each execution.',
    tag: 'BALANCED',
    tagColor: '#f59e0b',
  },
  {
    id: 'auto' as TradingMode,
    titleEs: 'Ejecución AI',
    titleEn: 'AI Execution',
    descEs: 'Autonomía total. Bobby ejecuta 24/7 basado en lógica neural.',
    descEn: 'Full autonomy. Bobby executes 24/7 based on neural logic.',
    tag: 'AUTONOMOUS',
    tagColor: '#22c55e',
  },
];

export default function TradingModeSelector({ onSelect, language = 'es', onInitVoice }: TradingModeSelectorProps) {
  const [selected, setSelected] = useState<TradingMode | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [showSelector, setShowSelector] = useState(true);
  const [lang, setLang] = useState(language);
  const isEs = lang === 'es';

  useEffect(() => {
    const saved = localStorage.getItem('bobby_trading_mode');
    if (saved === 'paper' || saved === 'confirm' || saved === 'auto') {
      onSelect(saved);
      setShowSelector(false);
    }
  }, [onSelect]);

  const handleInitialize = () => {
    if (!selected || !accepted) return;
    onInitVoice?.(); // Warm up audio on this user gesture
    localStorage.setItem('bobby_trading_mode', selected);
    localStorage.setItem('bobby_lang', lang);
    onSelect(selected);
    setShowSelector(false);
  };

  if (!showSelector) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', damping: 25 }}
          className="max-w-lg w-[92vw] border border-white/[0.06] bg-[#0a0a0a] backdrop-blur-xl rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-sm tracking-wide">BOBBY AGENT TRADER</h1>
                  <span className="text-[9px] font-mono text-white/30 tracking-[2px]">SYSTEM INITIALIZATION v4.2</span>
                </div>
              </div>
              <button onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
                className="text-[9px] font-mono text-white/30 border border-white/10 px-2 py-0.5 hover:text-white/60 transition-colors">
                {isEs ? 'EN' : 'ES'}
              </button>
            </div>

            <h2 className="text-white text-xl font-bold mt-5 mb-1">
              {isEs ? 'Bienvenido al Terminal.' : 'Welcome to the Kinetic Terminal.'}
            </h2>
            <p className="text-white/40 text-xs leading-relaxed">
              {isEs
                ? 'Estás a punto de interactuar con Bobby, una red neural de trading. Antes de sincronizar, define tus parámetros de ejecución.'
                : 'You are about to interface with Bobby, a high-frequency trading neural network. Before we synchronize your neural link, define your execution parameters.'}
            </p>
          </div>

          {/* Risk Disclaimer */}
          <div className="mx-6 mb-4 p-3 border border-amber-500/20 bg-amber-500/[0.04] rounded">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-sm mt-0.5">⚠</span>
              <div>
                <span className="text-amber-400/90 text-[10px] font-mono font-bold tracking-wider">RISK DISCLAIMER</span>
                <p className="text-amber-400/50 text-[9px] mt-1 leading-relaxed font-mono">
                  {isEs
                    ? 'TRADING INVOLUCRA RIESGO SIGNIFICATIVO. PARÁMETROS DEL SISTEMA PUEDEN RESULTAR EN PÉRDIDA TOTAL DE CAPITAL. BOBBY ES UN SISTEMA AGÉNTICO; LA RESPONSABILIDAD DE EJECUCIÓN PERMANECE CON EL OPERADOR.'
                    : 'TRADING INVOLVES SIGNIFICANT RISK. SYSTEM PARAMETERS MAY RESULT IN TOTAL CAPITAL DEPLETION. BOBBY IS AN AGENTIC SYSTEM; FINAL EXECUTION RESPONSIBILITY REMAINS WITH THE OPERATOR.'}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="px-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-[10px] font-mono tracking-[2px]">SELECT TRADING MODE</span>
              <span className="text-white/20 text-[9px] font-mono">
                {selected ? `${isEs ? 'MODO' : 'MODE'}: ${selected.toUpperCase()}` : `${isEs ? 'PENDIENTE' : 'PENDING'}...`}
              </span>
            </div>

            <div className="space-y-2">
              {MODES.map((mode, i) => (
                <motion.button
                  key={mode.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => setSelected(mode.id)}
                  className={`w-full flex items-center justify-between p-3 rounded transition-all text-left ${
                    selected === mode.id
                      ? 'border border-green-500/30 bg-green-500/[0.06]'
                      : 'border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{isEs ? mode.titleEs : mode.titleEn}</span>
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider"
                        style={{ background: `${mode.tagColor}22`, color: mode.tagColor }}>
                        {mode.tag}
                      </span>
                    </div>
                    <p className="text-white/30 text-[10px] mt-1">{isEs ? mode.descEs : mode.descEn}</p>
                  </div>
                  {selected === mode.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 ml-3">
                      <span className="text-black text-[10px] font-bold">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer: Accept + Initialize */}
          <div className="px-6 pb-6 pt-2 border-t border-white/[0.04]">
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-transparent accent-green-500" />
              <span className="text-white/40 text-[10px] font-mono">
                {isEs ? 'ASUMO_RIESGO' : 'READ_RISK'}
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button onClick={() => { setShowSelector(false); onSelect('paper'); localStorage.setItem('bobby_trading_mode', 'paper'); }}
                className="text-white/30 text-[10px] font-mono hover:text-white/60 transition-colors">
                CANCEL
              </button>
              <button
                onClick={handleInitialize}
                disabled={!selected || !accepted}
                className={`flex-1 py-2.5 rounded text-sm font-bold font-mono tracking-wider transition-all ${
                  selected && accepted
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-black hover:brightness-110 active:scale-[0.98]'
                    : 'bg-white/[0.04] text-white/15 cursor-not-allowed'
                }`}
              >
                {isEs ? 'INICIALIZAR AGENTE ›' : 'INITIALIZE AGENT ›'}
              </button>
            </div>

            {/* System status footer */}
            <div className="mt-4 flex items-center gap-4 text-[8px] font-mono text-white/15">
              <span>SYSTEM_INITIALIZED: STABLE</span>
              <span>RUNTIME_FRAMEWORK: VITE</span>
              <span>ACTIVE_STREAMS: {selected ? '3' : '0'}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
