import WebSocket from 'ws';
import { budgetStore, releaseVoice, type VoiceLease } from './voice-budget.js';

export async function hangupVoice(callId: string): Promise<void> {
  if (!/^rtc_[a-zA-Z0-9_-]+$/.test(callId)) throw new Error('Invalid voice call');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(10_000),
      });
      if (r.ok || r.status === 404 || r.status === 410) return;
    } catch { /* retry; retain the reservation if the provider cannot confirm */ }
  }
  throw new Error('Voice hangup not confirmed');
}
export async function finishVoice(key: string, lease: VoiceLease) {
  if (lease.callId) await hangupVoice(lease.callId);
  await releaseVoice(key, lease.id);
}

/** A server-owned sideband observes disconnects and enforces the deadline even
 * if the browser/native client disables its timer. Kept alive via waitUntil. */
export function ownVoiceCall(key: string, lease: VoiceLease & { callId: string }) {
  let ended = false;
  let readyResolve: () => void;
  let readyReject: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  let doneResolve: () => void;
  const done = new Promise<void>((resolve) => { doneResolve = resolve; });
  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${lease.callId}`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, handshakeTimeout: 8000,
  });
  const stop = async () => {
    if (ended) return;
    ended = true; clearTimeout(deadline); clearTimeout(connectTimeout);
    readyReject(new Error('Voice control disconnected'));
    try { await finishVoice(key, lease); }
    catch { console.error('[voice-budget] hangup deferred to recovery'); }
    finally { ws.terminate(); doneResolve(); }
  };
  const deadline = setTimeout(() => void stop(), Math.max(0, lease.deadline - Date.now()));
  const connectTimeout = setTimeout(() => void stop(), 10_000);
  ws.on('open', () => { clearTimeout(connectTimeout); readyResolve(); });
  ws.on('close', () => void stop());
  ws.on('error', () => void stop());
  // No transcripts/audio are persisted by this control channel.
  return { ready, done, stop };
}

export async function closeOwnedVoice(key: string, leaseId: string) {
  const value = await budgetStore.read(key);
  if (!value?.lease || value.lease.id !== leaseId) return;
  if (!value.lease.callId) throw new Error('Voice call still starting');
  await finishVoice(key, value.lease);
}
