// ============================================================
// POST /api/realtime-session
// Mints a short-lived ephemeral client secret for the OpenAI Realtime API.
// The standard OPENAI_API_KEY never leaves the server — the browser only ever
// receives a token valid for creating connections for 60 seconds. Token expiry
// does not end an active call; browser timeouts are not a hard billing boundary.
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VOICE_TOOLS, voiceInstructions } from './_lib/voice-tools.js';
import { voiceScreenContext } from '../src/lib/realtime-context.js';
import { enforcePublicRateLimit } from './_lib/request-security.js';

export const config = { maxDuration: 15 };

// Bobby's public voice is the full Realtime 2.1 model. The model is fixed
// here so an older deployment environment variable cannot quietly downgrade a
// user back to the mini voice experience.
const REALTIME_MODEL = 'gpt-realtime-2.1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!await enforcePublicRateLimit(req, res, 'realtime-session', 8, 600)) return;
  // Best-effort IP throttling, not an authenticated or atomic spending quota.
  if (!await enforcePublicRateLimit(req, res, 'realtime-session-day', 20, 86400)) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Realtime voice is not configured' });
  }

  const { lang, voice, autoLanguage, symbol, timeframe } = (req.body ?? {}) as Record<string, unknown>;
  const sessionLang = lang === 'en' ? 'en' : 'es';
  const languageMode = autoLanguage === false ? sessionLang : 'auto';
  const screen = voiceScreenContext(symbol, timeframe);
  const instructions = voiceInstructions(languageMode);

  // Honor the persona voice picked in onboarding — whitelisted, with the
  // env default as fallback. Legacy male/female map to their personas.
  const REALTIME_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
  const LEGACY_VOICE_MAP: Record<string, string> = { male: 'ash', female: 'coral', onyx: 'ash', nova: 'coral', fable: 'cedar', mellow: 'ballad' };
  const requestedVoice = typeof voice === 'string' ? LEGACY_VOICE_MAP[voice] || voice : '';
  const fallbackVoice = process.env.REALTIME_VOICE || 'marin';
  const sessionVoice = REALTIME_VOICES.includes(requestedVoice) ? requestedVoice : (REALTIME_VOICES.includes(fallbackVoice) ? fallbackVoice : 'marin');

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { anchor: 'created_at', seconds: 60 },
        session: {
          type: 'realtime',
          model: REALTIME_MODEL,
          instructions: `${instructions}\n\n${screen}`,
          max_output_tokens: 1024,
          truncation: { type: 'retention_ratio', retention_ratio: 0.8, token_limits: { post_instructions: 6000 } },
          audio: {
            // Fast conversational mode: detect the pause, interrupt Bobby when
            // the human starts speaking, and answer without waiting for a
            // semantic end-of-thought pass.
            input: {
              // Configure transcription before WebRTC connects. Doing this in
              // a later session.update raced with the first user turn: Bobby
              // could hear it, but the client never received the transcript
              // that switches the chart and starts the visual brief.
              transcription: {
                model: 'gpt-4o-mini-transcribe',
                ...(languageMode === 'auto' ? {} : { language: sessionLang }),
                prompt: 'Bitcoin, Ethereum, BTC, ETH, SOL, Nvidia, NVDA, Apple, Tesla, oro, gold, long, short, stop, soporte, resistencia.',
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.48,
                prefix_padding_ms: 280,
                silence_duration_ms: 360,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: { voice: sessionVoice },
          },
          tools: VOICE_TOOLS,
          tool_choice: 'auto',
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[RealtimeSession] mint failed:', response.status, detail.slice(0, 400));
      return res.status(502).json({ error: 'Could not start the voice session' });
    }

    const data = (await response.json()) as { value?: string; expires_at?: number };

    if (!data.value) return res.status(502).json({ error: 'Could not start the voice session' });
    console.info('[RealtimeSession] minted', { model: REALTIME_MODEL, language: languageMode, screen });
    return res.status(200).json({
      ok: true,
      client_secret: data.value,
      expires_at: data.expires_at,
      model: REALTIME_MODEL,
      instructions,
      max_duration_seconds: 300,
    });
  } catch (error) {
    console.error('[RealtimeSession]', error instanceof Error ? error.message : error);
    return res.status(502).json({ error: 'Could not start the voice session' });
  }
}
