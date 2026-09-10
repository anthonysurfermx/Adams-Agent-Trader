// Server-owned WebRTC calls. No reusable provider credential leaves Bobby.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { createHash } from 'node:crypto';
import { requireIdentity } from './_lib/user-identity.js';
import { enforcePublicRateLimit, requireInternalAuth } from './_lib/request-security.js';
import { realtimeConfig } from './_lib/realtime-config.js';
import { attachVoiceCall, BudgetError, budgetStore, DAILY_VOICE_MS, expiredVoiceLeases, releaseVoice, reserveVoice, resetAt, voiceBudgetKey, type VoiceLease } from './_lib/voice-budget.js';
import { closeOwnedVoice, finishVoice, hangupVoice, ownVoiceCall } from './_lib/voice-call-owner.js';
export const config = { maxDuration: 240 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  // Recovery if a server instance exits before its normal sideband deadline.
  if (req.method === 'GET' && req.query.sweep === '1') {
    if (!requireInternalAuth(req, res)) return;
    const rows = await expiredVoiceLeases();
    const results = await Promise.allSettled(rows.map(row => finishVoice(row.cache_key, row.payload.lease!)));
    return res.status(200).json({ closed: results.filter(r => r.status === 'fulfilled').length, failed: results.filter(r => r.status === 'rejected').length });
  }
  if (!['GET', 'POST'].includes(req.method ?? '')) return res.status(405).json({ error: 'Method not allowed' });
  const identity = await requireIdentity(req, res);
  if (!identity) return;
  if (!identity.authUserId) return res.status(401).json({ error: 'voice_sign_in' });
  const key = voiceBudgetKey(identity.authUserId);
  const resetsAt = new Date(resetAt(Date.now())).toISOString();
  let lease: VoiceLease | undefined;
  let callId: string | undefined;
  try {
    if (req.method === 'GET') {
      const budget = await budgetStore.read(key);
      const current = budget?.day === new Date().toISOString().slice(0, 10);
      const remaining = budget?.lease ? 0 : current ? Math.max(0, DAILY_VOICE_MS - budget!.used) : DAILY_VOICE_MS;
      return res.status(200).json({ remaining_seconds: Math.floor(remaining / 1000), active: Boolean(budget?.lease), resets_at: resetsAt });
    }
    const body = req.body ?? {};
    if (body.action === 'stop') {
      if (typeof body.lease_id !== 'string') return res.status(400).json({ error: 'Invalid session' });
      await closeOwnedVoice(key, body.lease_id);
      return res.status(200).json({ ok: true });
    }
    if (!await enforcePublicRateLimit(req, res, 'voice-call', 12, 60)) return;
    // Legacy native/Web clients cannot receive unbounded ephemeral credentials.
    if (typeof body.sdp !== 'string' || !body.sdp.startsWith('v=0') || body.sdp.length > 65_536) {
      return res.status(426).json({ error: 'voice_update_required' });
    }
    if (!process.env.OPENAI_API_KEY) throw new BudgetError('voice_unavailable');
    lease = await reserveVoice(key);
    const session = realtimeConfig(body);
    const form = new FormData();
    form.set('sdp', body.sdp); form.set('session', JSON.stringify(session));
    const r = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Safety-Identifier': createHash('sha256').update(identity.authUserId).digest('hex') },
      body: form, signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) {
      await releaseVoice(key, lease.id, budgetStore, Date.now(), true);
      lease = undefined;
      throw new BudgetError('voice_unavailable');
    }
    callId = r.headers.get('location')?.split('/').pop();
    if (!callId || !/^rtc_[a-zA-Z0-9_-]+$/.test(callId)) throw new BudgetError('voice_unavailable');
    const sdp = await r.text();
    await attachVoiceCall(key, lease.id, callId);
    const owner = ownVoiceCall(key, { ...lease, callId });
    waitUntil(owner.done);
    await owner.ready;
    return res.status(200).json({ ok: true, sdp, lease_id: lease.id,
      instructions: session.instructions, expires_at: new Date(lease.deadline).toISOString(),
      max_duration_seconds: Math.max(0, Math.floor((lease.deadline - Date.now()) / 1000)), resets_at: resetsAt });
  } catch (error) {
    if (lease && callId) {
      try { await hangupVoice(callId); await releaseVoice(key, lease.id); } catch { /* recovery retains the quota */ }
    }
    const code = error instanceof BudgetError ? error.code : 'voice_unavailable';
    const status = code === 'voice_daily_limit' ? 429 : code === 'voice_busy' ? 409 : 503;
    return res.status(status).json({ error: code, resets_at: resetsAt });
  }
}
