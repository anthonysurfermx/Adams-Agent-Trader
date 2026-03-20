// ============================================================
// POST /api/bobby-cycle — Autonomous market cycle
// The MAIN artifact is the market analysis, NOT the trade.
// Flow: Intel → Snapshot → Debate → Forum → Digest
// Works for ALL users — with or without positions
// Triggered by: cron (every 8h), droplet worker, or manual
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 120 };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const SB_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

// ---- Supabase helpers ----

async function sbInsert(table: string, data: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[Cycle] ${table} insert failed:`, res.status, errBody);
      return null;
    }
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) { console.error(`[Cycle] ${table} insert error:`, e); return null; }
}

async function sbQuery(table: string, query: string): Promise<any[]> {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ---- Claude helper ----

async function callClaude(model: string, system: string, userMsg: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userMsg }] }),
  });
  if (!res.ok) throw new Error(`Claude ${model}: ${res.status}`);
  const data = await res.json() as { content: Array<{ text: string }> };
  return data.content[0]?.text || '';
}

// ---- Fetch market intel (frozen snapshot) ----

async function fetchIntel(): Promise<any | null> {
  const urls = [
    'https://defimexico.org/api/bobby-intel',
    'https://defi-mexico-hub.vercel.app/api/bobby-intel',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) return await res.json();
    } catch { continue; }
  }
  return null;
}

// ---- Fetch OKX positions (optional — works without) ----

async function fetchPositions(): Promise<any[]> {
  try {
    const urls = [
      'https://defimexico.org/api/okx-perps',
      'https://defi-mexico-hub.vercel.app/api/okx-perps',
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'positions', params: { mode: 'live' } }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) return data.positions || [];
        }
      } catch { continue; }
    }
    return [];
  } catch { return []; }
}

// ---- Track record from resolved forum threads ----

async function getTrackRecord(): Promise<{ wins: number; losses: number; winRate: number; lastCalls: string }> {
  const data = await sbQuery('forum_threads',
    'resolution=neq.pending&resolution=not.is.null&select=resolution,symbol,conviction_score,resolution_pnl_pct&order=resolved_at.desc&limit=10'
  );
  if (!data.length) return { wins: 0, losses: 0, winRate: 50, lastCalls: 'No history' };
  const wins = data.filter((d: any) => d.resolution === 'win').length;
  const losses = data.filter((d: any) => d.resolution === 'loss').length;
  const total = data.length || 1;
  const lastCalls = data.slice(0, 5).map((d: any) =>
    `${d.symbol}: ${d.resolution?.toUpperCase()} (${d.resolution_pnl_pct > 0 ? '+' : ''}${d.resolution_pnl_pct}%)`
  ).join(', ') || 'No history';
  return { wins, losses, winRate: Math.round((wins / total) * 100), lastCalls };
}

// ---- Main handler ----

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Anthropic API key not configured' });
  }

  // Cron protection: Vercel crons send GET — verify with CRON_SECRET or allow POST (manual)
  const cronSecret = process.env.CRON_SECRET;
  if (req.method === 'GET' && cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized cron call' });
    }
  }

  const body = req.method === 'POST' ? (req.body || {}) : {};
  const language = body.language || 'es';
  const lang = language === 'es' ? 'es' : 'en';
  const kind = req.method === 'GET' ? 'cron' : (body.kind || 'manual');
  const startTime = Date.now();

  try {
    // ============================================================
    // PHASE 1: Freeze market snapshot
    // ============================================================
    const [intel, positions, track] = await Promise.all([
      fetchIntel(),
      fetchPositions(),
      getTrackRecord(),
    ]);

    if (!intel?.briefing) {
      return res.status(503).json({ error: 'Could not fetch market data' });
    }

    const marketSnapshot = {
      regime: intel.regime,
      fgi: intel.fearGreed,
      dxy: intel.dxy,
      btcPrice: intel.prices?.find((p: any) => p.symbol === 'BTC')?.price,
      ethPrice: intel.prices?.find((p: any) => p.symbol === 'ETH')?.price,
      performance: intel.performance,
    };

    // ============================================================
    // PHASE 2: Create cycle record (snapshot is now immutable)
    // ============================================================
    const cycle = await sbInsert('agent_cycles', {
      started_at: new Date().toISOString(),
      status: 'running',
      signals_found: intel.meta?.signalsRaw || 0,
      signals_filtered: intel.meta?.signalsFiltered || 0,
      dynamic_conviction: intel.performance?.dynamicConviction || null,
      safe_mode_active: intel.performance?.isSafeMode || false,
      mood: intel.performance?.mood || 'cautious',
    });
    const cycleId = cycle?.id as string | undefined;

    // ============================================================
    // PHASE 3: Multi-agent debate (frozen on the snapshot)
    // ============================================================
    const langRule = lang === 'es'
      ? 'Responde en español mexicano. Términos de trading en inglés están bien.'
      : 'Respond in English.';

    const memoryBlock = `\nBOBBY'S TRACK RECORD: Win Rate ${track.winRate}% | Last calls: ${track.lastCalls}${
      track.winRate < 60 ? '\nWARNING: Accuracy below 60%. Be extra cautious.' : ''
    }`;

    const positionsBlock = positions.length > 0
      ? `\nOPEN POSITIONS:\n${positions.map((p: any) =>
          `${p.symbol} ${p.direction?.toUpperCase()} ${p.leverage} | PnL: ${p.unrealizedPnl >= 0 ? '+' : ''}$${p.unrealizedPnl?.toFixed(2)} (${p.unrealizedPnlPct?.toFixed(1)}%)`
        ).join('\n')}`
      : '\nNO OPEN POSITIONS — Bobby is fully cash. Free to recommend fresh setups.';

    const contextBlock = `${intel.briefing}${memoryBlock}${positionsBlock}`;

    // Alpha Hunter (Haiku — cheap, aggressive, scans full market)
    const alphaPost = await callClaude('claude-haiku-4-5-20251001',
      `You are Alpha Hunter — a young hungry female trader. Scan ALL assets (crypto + stocks). Find the single BEST trade. Be SPECIFIC: entry, target, stop, leverage. ${langRule} 2-3 short paragraphs.`,
      `MARKET SCAN:\n${contextBlock}`, 350
    );

    // Red Team (Sonnet — adversarial, needs nuance)
    const redPost = await callClaude('claude-sonnet-4-20250514',
      `You are Red Team — 15-year risk veteran who lost $30M trusting "obvious" trades. Destroy Alpha's thesis. Attack data gaps, selection bias, timing. ${langRule} 2-3 short paragraphs. Every paragraph is a kill shot.${
        track.winRate < 60 ? ' Bobby has been WRONG recently. Be extra aggressive.' : ''
      }`,
      `MARKET DATA:\n${contextBlock}\n\nALPHA HUNTER'S THESIS:\n${alphaPost}`, 350
    );

    // Bobby CIO (Sonnet — judge, must pick side + recommend alternatives)
    const cioPost = await callClaude('claude-sonnet-4-20250514',
      `You are Bobby CIO. You heard Alpha and Red Team. Pick a side. Give conviction X/10. If sitting out, you MUST recommend what you'd need to see to enter, or an alternative asset. ${langRule} 2 short paragraphs. End with conviction score.${
        track.winRate < 60 ? ' Your recent calls have been poor. Acknowledge it.' : ''
      }`,
      `MARKET DATA:\n${contextBlock}\n\nALPHA:\n${alphaPost}\n\nRED TEAM:\n${redPost}`, 300
    );

    // Extract conviction & trade params
    const convMatch = cioPost.match(/(\d+)\s*\/\s*10/);
    const conviction = convMatch ? parseInt(convMatch[1]) / 10 : null;
    const entryMatch = cioPost.match(/(?:entry|buy(?:ing)?)\s*(?:at|en)?\s*\$?([\d,]+(?:\.\d+)?)/i);
    const stopMatch = cioPost.match(/(?:stop(?:\s*loss)?|sl)\s*(?:at|en)?\s*\$?([\d,]+(?:\.\d+)?)/i);
    const targetMatch = cioPost.match(/(?:target|tp|take\s*profit)\s*(?:at|en)?\s*\$?([\d,]+(?:\.\d+)?)/i);
    const dirMatch = cioPost.match(/\b(long|short)\b/i);
    const symMatch = (alphaPost + cioPost).match(/\b(BTC|ETH|SOL|HYPE|XRP|NVDA|TSLA|SPY|AAPL|GOLD|XAU)\b/i);

    // ============================================================
    // PHASE 4: Save to forum (debate is the primary artifact)
    // ============================================================
    const now = new Date();
    const topicDate = lang === 'es' ? now.toLocaleDateString('es-MX') : now.toLocaleDateString('en-US');
    const hours = now.getUTCHours();
    const session = hours < 12 ? (lang === 'es' ? 'Mañana' : 'Morning') :
                    hours < 18 ? (lang === 'es' ? 'Tarde' : 'Afternoon') :
                    (lang === 'es' ? 'Noche' : 'Evening');

    const topic = `${session} Cycle — ${topicDate}`;

    const thread = await sbInsert('forum_threads', {
      topic,
      trigger_reason: `Autonomous ${kind} cycle`,
      trigger_data: { regime: intel.regime, fgi: intel.fearGreed, dxy: intel.dxy },
      language: lang,
      conviction_score: conviction,
      price_at_creation: Object.fromEntries((intel.prices || []).map((p: any) => [p.symbol, p.price])),
      symbol: symMatch ? symMatch[1].toUpperCase() : null,
      direction: dirMatch ? dirMatch[1].toLowerCase() : null,
      entry_price: entryMatch ? parseFloat(entryMatch[1].replace(/,/g, '')) : null,
      stop_price: stopMatch ? parseFloat(stopMatch[1].replace(/,/g, '')) : null,
      target_price: targetMatch ? parseFloat(targetMatch[1].replace(/,/g, '')) : null,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      kind,
    });
    const threadId = thread?.id as string | undefined;

    if (threadId) {
      const snapshot = { regime: intel.regime, fgi: intel.fearGreed, dxy: intel.dxy, trackRecord: track };
      for (const post of [
        { agent: 'alpha', content: alphaPost },
        { agent: 'redteam', content: redPost },
        { agent: 'cio', content: cioPost },
      ]) {
        await sbInsert('forum_posts', {
          thread_id: threadId,
          agent: post.agent,
          content: post.content,
          data_snapshot: snapshot,
        });
      }
    }

    // ============================================================
    // PHASE 5: Generate digest summary (for "mientras dormías...")
    // ============================================================
    const symbol = symMatch ? symMatch[1].toUpperCase() : 'market';
    const direction = dirMatch ? dirMatch[1].toLowerCase() : 'neutral';
    const convNum = conviction !== null ? Math.round(conviction * 10) : 0;

    const digestPrompt = `Summarize this trading cycle in 2-3 sentences for someone who just woke up. Be direct and conversational — like a morning text from a smart friend.

CONTEXT:
- Symbol analyzed: ${symbol}
- Direction: ${direction}
- Conviction: ${convNum}/10
- Market regime: ${intel.regime || 'unknown'}
- Open positions: ${positions.length > 0 ? positions.map((p: any) => `${p.symbol} ${p.direction} ${p.unrealizedPnlPct?.toFixed(1)}%`).join(', ') : 'none'}
- Win rate: ${track.winRate}%

CIO VERDICT:
${cioPost}

${lang === 'es' ? 'Responde en español mexicano, casual pero inteligente. Como un mensaje de WhatsApp de tu trader de confianza.' : 'Respond in English, casual but smart. Like a morning text from your trusted trader.'}`;

    const digestSummary = await callClaude('claude-haiku-4-5-20251001',
      'You write ultra-concise morning market digests. No greetings, no fluff. Jump straight to what matters.',
      digestPrompt, 150
    );

    // Build highlights array
    const highlights = [{
      symbol,
      direction,
      conviction: convNum,
      verdict: conviction !== null && conviction >= 0.6 ? 'execute' : conviction !== null && conviction >= 0.4 ? 'watch' : 'reject',
    }];

    // Save global digest (for anonymous users + anyone who opens Bobby)
    const digest = await sbInsert('user_digests', {
      cycle_id: cycleId || null,
      thread_id: threadId || null,
      wallet_address: null, // Global digest
      summary: digestSummary,
      highlights: JSON.stringify(highlights),
      positions_snapshot: positions.length > 0 ? JSON.stringify(positions) : null,
      market_snapshot: JSON.stringify(marketSnapshot),
      language: lang,
      kind,
    });

    // ============================================================
    // PHASE 6: Update cycle as completed
    // ============================================================
    if (cycleId) {
      const latencyMs = Date.now() - startTime;
      await fetch(`${SB_URL}/rest/v1/agent_cycles?id=eq.${cycleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
        },
        body: JSON.stringify({
          completed_at: new Date().toISOString(),
          status: 'completed',
          latency_ms: latencyMs,
          llm_reasoning: `Debate: ${symbol} ${direction} ${convNum}/10`,
        }),
      });
    }

    return res.status(200).json({
      ok: true,
      cycleId,
      threadId,
      digestId: digest?.id,
      topic,
      conviction,
      symbol,
      direction,
      highlights,
      summary: digestSummary,
      positions: positions.length,
      latencyMs: Date.now() - startTime,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cycle] Error:', msg);
    return res.status(500).json({ error: msg });
  }
}
