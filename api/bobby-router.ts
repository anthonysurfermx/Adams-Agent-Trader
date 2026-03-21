// ============================================================
// POST /api/bobby-router — Hybrid intent classifier
// Layer 1: deterministic regex (free, instant)
// Layer 2: Haiku classifier (cheap, only for ambiguous)
// Returns: { intent, confidence, language, reason }
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const VALID_INTENTS = [
  'greeting', 'identity', 'portfolio', 'price', 'chart',
  'market_data', 'analyze', 'trade_chat', 'onboarding',
  'safety', 'follow_up', 'help', 'off_topic',
] as const;

type Intent = typeof VALID_INTENTS[number];

interface RouterResult {
  intent: Intent;
  confidence: number;
  language: string;
  reason: string;
  source: 'regex' | 'haiku';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { message, context } = req.body as {
    message: string;
    context?: string; // last Bobby response for follow-up detection
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message required' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(200).json({
      intent: 'trade_chat',
      confidence: 0.5,
      language: 'en',
      reason: 'No API key — defaulting to trade_chat',
      source: 'regex',
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: `You are a trading platform intent classifier. Classify the user's message into exactly ONE intent.

INTENTS:
- greeting: hi, hello, thanks, bye, casual chat
- identity: who are you, what do you do
- portfolio: balance, positions, PnL, my account
- price: asking for a specific asset price (short query)
- chart: asking for technical analysis, charts, RSI, MACD, support/resistance
- market_data: funding rates, open interest, fear & greed, whale signals, Polymarket
- analyze: explicit request for full market analysis or debate
- trade_chat: opinion about a trade, should I buy/sell, market outlook, thesis, comparison
- onboarding: beginner question, "I'm new", "where do I start", small capital advice
- safety: is this safe, scam check, honeypot, rug pull
- follow_up: continuation of previous conversation (why?, and the stop?, explain more)
- help: what can you do, commands, capabilities
- off_topic: weather, sports, jokes, personal life, not related to trading/markets

RULES:
- If it mentions ANY market, asset, crypto, stock, or trading concept → trade_chat (not off_topic)
- If it's in Spanish, still classify correctly
- "qué pasó con los mercados" = trade_chat
- "wen moon" = trade_chat
- "is this the bottom?" = trade_chat
- Short vague messages like "hmm", "ok", "..." = off_topic

Respond ONLY with JSON, no markdown:
{"intent":"trade_chat","confidence":0.95,"language":"es","reason":"market outlook question"}`,
        messages: [
          {
            role: 'user',
            content: context
              ? `Previous Bobby response: "${context.slice(0, 200)}"\n\nUser message: "${message}"`
              : `User message: "${message}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return res.status(200).json({
        intent: 'trade_chat' as Intent,
        confidence: 0.5,
        language: 'en',
        reason: 'Haiku API error — defaulting to trade_chat',
        source: 'regex',
      });
    }

    const data = await response.json() as { content: Array<{ text: string }> };
    const text = data.content[0]?.text || '';

    // Parse JSON response
    try {
      const result = JSON.parse(text);
      const intent = VALID_INTENTS.includes(result.intent) ? result.intent : 'trade_chat';
      const confidence = typeof result.confidence === 'number' ? Math.min(Math.max(result.confidence, 0), 1) : 0.7;

      // Safety: if confidence < 0.7, fall back to trade_chat (better to engage than show menu)
      const finalIntent = confidence < 0.5 ? 'trade_chat' : intent;

      return res.status(200).json({
        intent: finalIntent,
        confidence,
        language: result.language || 'en',
        reason: result.reason || 'classified by Haiku',
        source: 'haiku',
      } as RouterResult);
    } catch {
      // JSON parse failed — extract intent from text
      const match = text.match(/"intent"\s*:\s*"(\w+)"/);
      return res.status(200).json({
        intent: (match?.[1] as Intent) || 'trade_chat',
        confidence: 0.6,
        language: 'en',
        reason: 'Haiku response parsed with fallback',
        source: 'haiku',
      });
    }
  } catch (error) {
    return res.status(200).json({
      intent: 'trade_chat' as Intent,
      confidence: 0.5,
      language: 'en',
      reason: 'Network error — defaulting to trade_chat',
      source: 'regex',
    });
  }
}
