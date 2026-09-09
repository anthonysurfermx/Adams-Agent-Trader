// Swaps inside the Live Desk — Base only, Uniswap V3, through the same
// audited SwapConfirm card the chat uses (quote → attest → build → approve →
// swap → on-chain receipt). Bobby never signs: the human's wallet does, and
// the server keeps every guard (allow-list, ticket cap, price impact, stock
// eligibility, country gate). Two entry points share one panel:
//   DeskSwapCard — under a LONG verdict, offering the asset that was analyzed
//   SwapSheet    — from the menu, with a token picker, for any allow-listed pair
import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ArrowLeftRight, Wallet, X } from 'lucide-react';
import { SwapConfirm, type TradeExecution } from '@/components/adams/SwapConfirm';
import { BASE_SWAP_LIMITS, BASE_SWAP_TOKENS, findBaseToken, isStockToken, type BaseSwapToken } from '@/lib/base-swap/tokens';
import { t } from '@/lib/companions/i18n';

const DEFAULT_TICKET_USD = 25;
/** What the desk offers to buy: every allow-listed token except the stables you pay with and WETH (ETH covers it). */
const BUYABLE: readonly BaseSwapToken[] = BASE_SWAP_TOKENS.filter((token) => !token.stable && token.symbol !== 'WETH');

interface QuotePreview { amountOut: string; priceImpactPct: number | null; withheld: string[]; /** The cap the server is enforcing right now (env can lower the code cap, e.g. the canary's $1). */ maxTicketUsd: number | null }

/** A public, wallet-free quote so the human sees the size of the trade before touching a wallet. */
function useQuotePreview(token: BaseSwapToken, amountUsd: number) {
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!(amountUsd >= BASE_SWAP_LIMITS.minTicketUsd)) { setPreview(null); setError(null); return; }
    let active = true;
    setPreview(null);
    setError(null);
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/base-swap?tokenIn=USDC&tokenOut=${encodeURIComponent(token.symbol)}&amount=${amountUsd.toFixed(2)}`);
        const data = (await res.json()) as { ok?: boolean; error?: string; quote?: { amountOut?: unknown; priceImpactPct?: unknown; txWithheld?: unknown; limits?: { maxTicketUsd?: unknown } } };
        if (!active) return;
        if (!res.ok || !data.ok || !data.quote) { setError(data.error || t('Quote unavailable right now.', 'Cotización no disponible ahora.')); return; }
        setPreview({
          amountOut: String(data.quote.amountOut ?? '—'),
          priceImpactPct: typeof data.quote.priceImpactPct === 'number' ? data.quote.priceImpactPct : null,
          withheld: Array.isArray(data.quote.txWithheld) ? data.quote.txWithheld.map(String) : [],
          maxTicketUsd: typeof data.quote.limits?.maxTicketUsd === 'number' ? data.quote.limits.maxTicketUsd : null,
        });
      } catch {
        if (active) setError(t('Quote unavailable right now.', 'Cotización no disponible ahora.'));
      }
    }, 350);
    return () => { active = false; window.clearTimeout(id); };
  }, [token, amountUsd]);
  return { preview, error };
}

function SwapPanel({ initial, conviction, pickable }: { initial: BaseSwapToken; conviction: number | null; pickable: boolean }) {
  const [token, setToken] = useState<BaseSwapToken>(initial);
  const [amount, setAmount] = useState<number>(DEFAULT_TICKET_USD);
  const [armed, setArmed] = useState(false);
  const [touched, setTouched] = useState(false);
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  useEffect(() => { setToken(initial); }, [initial]);
  // A new pair or size means a new card: SwapConfirm validates what it signs against what it asked for.
  useEffect(() => { setArmed(false); }, [token, amount]);

  const codeCap = Math.min(BASE_SWAP_LIMITS.maxTicketUsd, token.maxTicketUsd ?? BASE_SWAP_LIMITS.maxTicketUsd);
  const valid = Number.isFinite(amount) && amount >= BASE_SWAP_LIMITS.minTicketUsd && amount <= codeCap;
  const { preview, error } = useQuotePreview(token, valid ? amount : 0);
  // The server may be running a lower cap than the code (canary rollout). The
  // first quote reveals it; an untouched default follows it, a typed amount never does.
  const cap = preview?.maxTicketUsd !== null && preview?.maxTicketUsd !== undefined ? Math.min(codeCap, preview.maxTicketUsd) : codeCap;
  useEffect(() => {
    if (!touched && preview?.maxTicketUsd !== null && preview?.maxTicketUsd !== undefined && amount > preview.maxTicketUsd) setAmount(Math.max(BASE_SWAP_LIMITS.minTicketUsd, Math.floor(preview.maxTicketUsd)));
  }, [touched, preview, amount]);
  const stock = isStockToken(token);
  const trade = useMemo<TradeExecution>(() => ({
    tokenSymbol: token.symbol,
    amountUsd: amount,
    confidence: conviction !== null ? Math.round(conviction) : 0,
    sizingMethod: 'manual',
    chain: 'base',
  }), [token.symbol, amount, conviction]);

  const crypto = BUYABLE.filter((item) => !isStockToken(item));
  const stocks = BUYABLE.filter((item) => isStockToken(item));
  const shortAddress = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  return (
    <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.04] p-4 space-y-3">
      <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em]">
        <span className="flex items-center gap-2 whitespace-nowrap text-sky-300"><ArrowLeftRight size={12} />{t('SWAP ON BASE', 'SWAP EN BASE')}</span>
        <span className="whitespace-nowrap text-white/40">{t('YOU SIGN', 'TÚ FIRMAS')}<span className="hidden sm:inline">{t(' · BOBBY NEVER DOES', ' · BOBBY NUNCA')}</span></span>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {pickable ? (
          <label className="min-w-[160px] flex-1">
            <span className="block text-[9px] font-mono tracking-[0.2em] text-white/40">{t('BUY', 'COMPRAR')}</span>
            <select value={token.symbol} onChange={(e) => { const next = findBaseToken(e.target.value); if (next) setToken(next); }} aria-label={t('Token to buy', 'Token a comprar')} className="mt-1 w-full rounded-lg border border-white/[0.1] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50">
              <optgroup label={t('Crypto', 'Cripto')}>{crypto.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.name}</option>)}</optgroup>
              <optgroup label={t('Tokenized stocks (Coinbase B20)', 'Acciones tokenizadas (Coinbase B20)')}>{stocks.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} · {item.underlyingSymbol}</option>)}</optgroup>
            </select>
          </label>
        ) : (
          <div className="min-w-[140px] flex-1">
            <div className="text-[9px] font-mono tracking-[0.2em] text-white/40">{t('BUY', 'COMPRAR')}</div>
            <div className="mt-1 text-lg font-semibold text-white">{token.symbol}<span className="ml-2 text-xs font-normal text-white/45">{token.name}</span></div>
          </div>
        )}
        <label className="w-32">
          <span className="block text-[9px] font-mono tracking-[0.2em] text-white/40">{t('WITH USDC', 'CON USDC')}</span>
          <div className="mt-1 flex items-center rounded-lg border border-white/[0.1] bg-black/40 px-3 py-2 text-sm text-white focus-within:border-sky-400/50">
            <span className="text-white/45">$</span>
            <input type="number" inputMode="decimal" min={BASE_SWAP_LIMITS.minTicketUsd} max={cap} step={1} value={Number.isFinite(amount) ? amount : ''} onChange={(e) => { setTouched(true); setAmount(Number(e.target.value)); }} aria-label={t('Amount in USDC', 'Monto en USDC')} className="w-full bg-transparent pl-1 outline-none" />
          </div>
        </label>
      </div>

      <div className="text-[11px] font-mono text-white/55 min-h-[16px]">
        {!valid
          ? t(`Between $${BASE_SWAP_LIMITS.minTicketUsd} and $${cap} per ticket.`, `Entre $${BASE_SWAP_LIMITS.minTicketUsd} y $${cap} por ticket.`)
          : error
            ? <span className="text-amber-300">{error}</span>
            : preview
              ? <>≈ {preview.amountOut} {token.symbol}{preview.priceImpactPct !== null ? ` · ${t('impact', 'impacto')} ${preview.priceImpactPct.toFixed(2)}%` : ''}</>
              : t('Quoting on Uniswap V3…', 'Cotizando en Uniswap V3…')}
      </div>
      {preview?.withheld.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.05] px-3 py-2 text-[11px] text-amber-200/90">
          <span>{t('Quote only for now: ', 'Por ahora solo cotización: ')}{preview.withheld.join(' · ')}</span>
          {amount > cap && <button type="button" onClick={() => { setTouched(true); setAmount(Math.max(BASE_SWAP_LIMITS.minTicketUsd, Math.floor(cap))); }} className="rounded-md border border-amber-300/40 px-2 py-0.5 font-mono text-[10px] text-amber-200 hover:bg-amber-300/10">{t(`Use $${Math.floor(cap)}`, `Usar $${Math.floor(cap)}`)}</button>}
        </div>
      ) : null}
      {stock && (
        <div className="text-[10px] font-mono leading-relaxed text-white/40">
          {t('Coinbase tokenized stock (B20). It is not the underlying share. Not offered to U.S. persons or restricted countries; you attest before anything is built.', 'Acción tokenizada por Coinbase (B20). No es la acción subyacente. No se ofrece a personas de EE. UU. ni a países restringidos; tú lo atestiguas antes de construir nada.')}
        </div>
      )}

      {!isConnected ? (
        <button type="button" onClick={() => void open()} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 font-mono text-xs font-bold tracking-[0.14em] text-sky-300 transition hover:bg-sky-500/25">
          <Wallet size={14} />{t('CONNECT WALLET', 'CONECTAR WALLET')}
        </button>
      ) : !armed ? (
        <div className="flex items-center gap-3">
          <button type="button" disabled={!valid} onClick={() => setArmed(true)} className="h-11 flex-1 rounded-xl bg-sky-400 font-mono text-xs font-bold tracking-[0.14em] text-black transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40">{t('PREPARE SWAP', 'PREPARAR SWAP')}</button>
          <span className="font-mono text-[10px] text-white/40">{shortAddress}</span>
        </div>
      ) : (
        <SwapConfirm key={`${token.symbol}-${amount}`} trade={trade} walletAddress={address} title={t('Your swap · you review, you sign:', 'Tu swap · tú revisas, tú firmas:')} />
      )}

      <div className="text-[9px] font-mono tracking-[0.12em] text-white/30">
        {t(`Base · Uniswap V3 · max $${cap} per ticket · analysis is not advice`, `Base · Uniswap V3 · máx. $${cap} por ticket · el análisis no es asesoría`)}
      </div>
    </div>
  );
}

/** Under a LONG verdict: the analyzed asset, if it lives on Bobby's Base allow-list (BTC → cbBTC, NVDA → NVDAc…). */
export function DeskSwapCard({ symbol, conviction }: { symbol: string; conviction: number | null }) {
  const token = useMemo(() => findBaseToken(symbol), [symbol]);
  if (!token || token.stable) return null;
  return <SwapPanel initial={token} conviction={conviction} pickable={false} />;
}

/** From the menu: any allow-listed pair, USDC in. */
export function SwapSheet({ initialSymbol, onClose }: { initialSymbol?: string | null; onClose: () => void }) {
  const initial = useMemo(() => {
    const hit = findBaseToken(initialSymbol);
    return hit && !hit.stable ? hit : BUYABLE[0];
  }, [initialSymbol]);
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/85" />
        <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-[61] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] text-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] p-4">
            <div>
              <Dialog.Title className="font-mono text-sm tracking-[0.15em]">{t('Swap on Base', 'Swap en Base')}</Dialog.Title>
              <div className="mt-0.5 text-[10px] font-mono tracking-[0.12em] text-white/40">{t('Your wallet signs. Bobby prepares and verifies.', 'Tu wallet firma. Bobby prepara y verifica.')}</div>
            </div>
            <Dialog.Close aria-label={t('Close and return to desk', 'Cerrar y volver al desk')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/80 hover:bg-white/10"><X size={20} /></Dialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
            <SwapPanel initial={initial} conviction={null} pickable />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
