// ============================================================
// PerformanceStats — Kinetic Terminal style performance dashboard
// Shows: Total Return, Win Rate, Max Drawdown, Trades
// + Live Execution Ledger (last 5 closed trades)
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PnlSummary {
  startingCapital: number;
  currentEquity: number;
  totalReturn: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface ClosedPosition {
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  pnlPct: number;
  leverage: string;
  closeTime: string;
  result: string;
}

export function PerformanceStats({ language = 'es' }: { language?: string }) {
  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [trades, setTrades] = useState<ClosedPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bobby-pnl')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setSummary(d.summary);
          setTrades((d.closedPositions || []).slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 text-center">
      <span className="text-[10px] font-mono text-white/20 animate-pulse">LOADING PERFORMANCE DATA...</span>
    </div>
  );

  if (!summary) return null;

  const isEs = language === 'es';
  const stats = [
    {
      label: 'TOTAL_RETURN',
      value: `${summary.totalReturn >= 0 ? '+' : ''}${summary.totalReturn.toFixed(1)}%`,
      color: summary.totalReturn >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'WIN_RATE',
      value: `${summary.winRate.toFixed(0)}%`,
      color: summary.winRate >= 50 ? 'text-green-400' : 'text-amber-400',
    },
    {
      label: 'TRADES',
      value: `${summary.wins}W / ${summary.losses}L`,
      color: 'text-white/80',
    },
    {
      label: 'EQUITY',
      value: `$${summary.currentEquity.toFixed(2)}`,
      color: 'text-white',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-3 rounded"
          >
            <span className="text-[8px] font-mono text-white/25 tracking-[1px] block mb-1">{s.label}</span>
            <span className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Execution Ledger */}
      {trades.length > 0 && (
        <div className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-mono text-white/25 tracking-[2px]">LIVE_EXECUTION_LEDGER</span>
            <span className="text-[8px] font-mono text-green-400/40">{trades.length} RECENT</span>
          </div>
          <div className="space-y-1">
            {trades.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[9px] font-mono py-1 border-b border-white/[0.03] last:border-0">
                <span className="text-white/30 w-16">
                  {new Date(t.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-white/60 w-12">{t.symbol}</span>
                <span className={`w-10 ${t.direction === 'long' ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {t.direction.toUpperCase()}
                </span>
                <span className="text-white/40 w-16 text-right">${t.entryPrice.toFixed(2)}</span>
                <span className={`w-16 text-right font-bold ${t.result === 'WIN' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(1)}%
                </span>
                <span className={`w-14 text-right text-[8px] px-1.5 py-0.5 rounded ${
                  t.result === 'WIN' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {t.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
