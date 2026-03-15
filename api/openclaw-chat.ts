// ============================================================
// POST /api/openclaw-chat
// Proxy to OpenClaw Gateway for free-form conversational AI
// Streams SSE responses from the OpenClaw agent
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENCLAW_GATEWAY_URL) {
    return res.status(503).json({ error: 'OpenClaw gateway not configured' });
  }

  const { message, history } = req.body as {
    message: string;
    history?: Array<{ role: string; content: string }>;
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  // Build messages array with optional conversation history
  const messages = [
    {
      role: 'system' as const,
      content: `You are Adams, the AI trading agent of Agent Radar — a DeFi intelligence platform for the Mexican and LATAM crypto community. You speak Spanish by default but adapt to the user's language. You have access to OKX OnchainOS whale signals, Polymarket smart money consensus, and on-chain DEX data. Be concise, technical, and actionable. If asked about markets, provide your analysis based on available data. If you don't have live data, say so honestly.`,
    },
    ...(history || []).slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    // OpenClaw Gateway uses OpenAI-compatible chat completions
    const gatewayUrl = OPENCLAW_GATEWAY_URL.replace(/\/$/, '');
    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        model: 'default',
        messages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw error:', response.status, errorText);
      return res.status(502).json({
        error: 'OpenClaw gateway error',
        status: response.status,
      });
    }

    // Stream SSE response back to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(502).json({ error: 'No response stream' });
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Forward SSE chunks directly
        res.write(chunk);
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error('OpenClaw proxy error:', error);
    return res.status(502).json({
      error: 'Failed to connect to OpenClaw gateway',
    });
  }
}
