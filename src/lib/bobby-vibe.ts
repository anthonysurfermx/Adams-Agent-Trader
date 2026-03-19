export type BobbyMode = 'AGGRESSIVE' | 'CONSERVATIVE' | 'NEUTRAL';
export type VibeRegime = 'RISK_ON' | 'RISK_OFF' | 'PANIC' | 'NEUTRAL';
export type VibeSource = 'explicit_user_message' | 'memory';

export interface BobbyVibeState {
  summary: string;
  mode: BobbyMode;
  regimeBias: VibeRegime;
  strength: number;
  confidenceShift: number;
  maxAdjustment: number;
  explicitMode: boolean;
  actions: string[];
  reasons: string[];
  detectedAt: number;
  expiresAt: number;
  source: VibeSource;
}

const STORAGE_KEY = 'bobby_user_vibe';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.%/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildVibe(params: {
  summary: string;
  mode: BobbyMode;
  regimeBias: VibeRegime;
  strength: number;
  confidenceShift: number;
  maxAdjustment: number;
  explicitMode: boolean;
  actions: string[];
  reasons: string[];
  source: VibeSource;
  ttlHours: number;
  now: number;
}): BobbyVibeState {
  return {
    summary: params.summary,
    mode: params.mode,
    regimeBias: params.regimeBias,
    strength: clamp(params.strength, 0, 1),
    confidenceShift: clamp(params.confidenceShift, -0.4, 0.4),
    maxAdjustment: clamp(params.maxAdjustment, 0.1, 0.4),
    explicitMode: params.explicitMode,
    actions: params.actions,
    reasons: params.reasons,
    detectedAt: params.now,
    expiresAt: params.now + (params.ttlHours * 60 * 60 * 1000),
    source: params.source,
  };
}

export function shouldClearStoredVibe(text: string): boolean {
  const lower = normalize(text);
  return /\b(reset|clear|forget|cancel|neutral mode|back to neutral|sin vibe|quita el modo|borra el modo)\b/.test(lower)
    || /\b(modo neutral|modo normal|vuelve a neutral|regresa a neutral)\b/.test(lower);
}

export function inferUserVibe(text: string, now = Date.now()): BobbyVibeState | null {
  const lower = normalize(text);
  if (!lower) return null;

  if (/\b(modo neutral|neutral mode|modo normal|default mode)\b/.test(lower)) {
    return buildVibe({
      summary: 'User explicitly reset Bobby to neutral mode.',
      mode: 'NEUTRAL',
      regimeBias: 'NEUTRAL',
      strength: 0.5,
      confidenceShift: 0,
      maxAdjustment: 0.1,
      explicitMode: true,
      actions: ['STAY_DATA_ANCHORED', 'NO_REGIME_OVERRIDE'],
      reasons: ['Explicit neutral mode request'],
      source: 'explicit_user_message',
      ttlHours: 6,
      now,
    });
  }

  if (/\b(modo conservador|go conservative|stay conservative|risk off mode|defensive mode)\b/.test(lower)) {
    return buildVibe({
      summary: 'User explicitly wants conservative positioning.',
      mode: 'CONSERVATIVE',
      regimeBias: 'RISK_OFF',
      strength: 0.8,
      confidenceShift: -0.18,
      maxAdjustment: 0.22,
      explicitMode: true,
      actions: ['CUT_LEVERAGE', 'PREFER_GOLD_OR_CASH', 'TRIM_CRYPTO_BETA'],
      reasons: ['Explicit conservative mode request'],
      source: 'explicit_user_message',
      ttlHours: 24,
      now,
    });
  }

  if (/\b(modo agresivo|go aggressive|stay aggressive|risk on mode|attack mode)\b/.test(lower)) {
    return buildVibe({
      summary: 'User explicitly wants aggressive positioning.',
      mode: 'AGGRESSIVE',
      regimeBias: 'RISK_ON',
      strength: 0.8,
      confidenceShift: 0.18,
      maxAdjustment: 0.22,
      explicitMode: true,
      actions: ['ALLOW_HIGH_BETA', 'PREFER_CRYPTO_AND_TECH', 'ALLOW_MORE_CONVICTION_IF_CONFIRMED'],
      reasons: ['Explicit aggressive mode request'],
      source: 'explicit_user_message',
      ttlHours: 24,
      now,
    });
  }

  if (/\b(guerra|war|iran|israel|missile|attack|bomb|conflict|geopolit|terror)\b/.test(lower)) {
    return buildVibe({
      summary: 'Geopolitical shock detected. Treat as risk-off until cross-asset data disagrees.',
      mode: 'CONSERVATIVE',
      regimeBias: 'RISK_OFF',
      strength: 0.92,
      confidenceShift: -0.24,
      maxAdjustment: 0.32,
      explicitMode: false,
      actions: ['PREFER_GOLD_OR_CASH', 'CUT_CRYPTO_EXPOSURE', 'LOWER_LEVERAGE'],
      reasons: ['Geopolitical conflict keywords'],
      source: 'explicit_user_message',
      ttlHours: 12,
      now,
    });
  }

  if (/\b((fed|fomc).*(cut|cuts|bajar|baja|recort|recorte).*(rate|rates|tasa|tasas)|(rate|rates|tasa|tasas).*(cut|cuts|bajar|baja|recort|recorte).*(fed|fomc)|dovish|liquidity wave|liquidez)\b/.test(lower)) {
    return buildVibe({
      summary: 'Dovish macro catalyst detected. Risk assets can re-rate if live data confirms.',
      mode: 'AGGRESSIVE',
      regimeBias: 'RISK_ON',
      strength: 0.88,
      confidenceShift: 0.24,
      maxAdjustment: 0.3,
      explicitMode: false,
      actions: ['PREFER_BTC_AND_TECH', 'ALLOW_HIGHER_CONVICTION_IF_CONFIRMED', 'LOOK_FOR_HIGH_BETA_FOLLOW_THROUGH'],
      reasons: ['Rate-cut or dovish macro keywords'],
      source: 'explicit_user_message',
      ttlHours: 12,
      now,
    });
  }

  if (/\b(panico|panic|fear|miedo|bloodbath|selloff|capitul|flight to safety|mercado en panico)\b/.test(lower)) {
    return buildVibe({
      summary: 'Panic regime detected. Reduce leverage, but allow contrarian spot buys if data confirms capitulation.',
      mode: 'CONSERVATIVE',
      regimeBias: 'PANIC',
      strength: 0.78,
      confidenceShift: -0.12,
      maxAdjustment: 0.2,
      explicitMode: false,
      actions: ['CUT_LEVERAGE', 'PREFER_SPOT_OR_DCA', 'ALLOW_CONTRARIAN_BUY_IF_DATA_CONFIRM'],
      reasons: ['Panic or fear keywords'],
      source: 'explicit_user_message',
      ttlHours: 8,
      now,
    });
  }

  if (/\b(risk on|bullish|muy bullish|super bullish|melt up|breakout|euforia|euphor)\b/.test(lower)) {
    return buildVibe({
      summary: 'User is leaning risk-on. Use as a tailwind, not as proof.',
      mode: 'AGGRESSIVE',
      regimeBias: 'RISK_ON',
      strength: 0.62,
      confidenceShift: 0.12,
      maxAdjustment: 0.16,
      explicitMode: false,
      actions: ['LOOK_FOR_CONFIRMATION_IN_PRICE_AND_FLOWS'],
      reasons: ['Generic bullish narrative keywords'],
      source: 'explicit_user_message',
      ttlHours: 6,
      now,
    });
  }

  if (/\b(risk off|bearish|uncertainty|incertidumbre|recession|recesion|crisis)\b/.test(lower)) {
    return buildVibe({
      summary: 'User is leaning defensive. Keep Bobby cautious unless live data strongly disagrees.',
      mode: 'CONSERVATIVE',
      regimeBias: 'RISK_OFF',
      strength: 0.65,
      confidenceShift: -0.12,
      maxAdjustment: 0.16,
      explicitMode: false,
      actions: ['LOWER_RISK', 'ASK_FOR_CROSS_ASSET_CONFIRMATION'],
      reasons: ['Generic defensive narrative keywords'],
      source: 'explicit_user_message',
      ttlHours: 6,
      now,
    });
  }

  return null;
}

export function saveStoredVibe(vibe: BobbyVibeState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vibe));
}

export function clearStoredVibe(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStoredVibe(now = Date.now()): BobbyVibeState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BobbyVibeState;
    if (!parsed?.mode || !parsed?.expiresAt || parsed.expiresAt <= now) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      ...parsed,
      strength: clamp(parsed.strength, 0, 1),
      confidenceShift: clamp(parsed.confidenceShift, -0.4, 0.4),
      maxAdjustment: clamp(parsed.maxAdjustment, 0.1, 0.4),
      source: 'memory',
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
