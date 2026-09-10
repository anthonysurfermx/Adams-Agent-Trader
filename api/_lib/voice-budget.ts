import { createHmac, randomUUID } from 'node:crypto';
import { bobbyRest, bobbyServiceHeaders, bobbyServiceKey } from './bobby-db.js';

export const DAILY_VOICE_MS = 180_000;
export interface VoiceLease { id: string; start: number; deadline: number; reserved: number; callId?: string }
export interface VoiceBudget { revision: string; day: string; used: number; lease: VoiceLease | null }
export interface BudgetStore {
  read(key: string): Promise<VoiceBudget | null>;
  insert(key: string, value: VoiceBudget): Promise<void>;
  replace(key: string, revision: string, value: VoiceBudget): Promise<boolean>;
}
export class BudgetError extends Error {
  constructor(public code: 'voice_daily_limit' | 'voice_busy' | 'voice_unavailable') { super(code); }
}
export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);
export const resetAt = (now: number) => new Date(`${utcDay(now)}T00:00:00Z`).getTime() + 86_400_000;
export const voiceBudgetKey = (identity: string) => 'voice-budget:v1:' + createHmac('sha256', bobbyServiceKey()).update(identity).digest('hex');
const fresh = (now: number): VoiceBudget => ({ revision: randomUUID(), day: utcDay(now), used: 0, lease: null });
const rowPath = (key: string) => `api_cache?cache_key=eq.${encodeURIComponent(key)}`;
const body = (key: string, value: VoiceBudget) => JSON.stringify({ cache_key: key, payload: value,
  // This is an authoritative quota row in the service-only cache table. It must
  // outlive the UTC day and any call crossing midnight; never use cache helpers
  // that fail open or overwrite it with an unconditional upsert.
  expires_at: new Date(Date.parse(value.day + 'T00:00:00Z') + 3 * 86_400_000).toISOString(), updated_at: new Date().toISOString() });
async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(bobbyRest(path), { ...init, headers: bobbyServiceHeaders(init.headers as Record<string, string>), signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new BudgetError('voice_unavailable');
  return r;
}
export const budgetStore: BudgetStore = {
  async read(key) {
    const rows = await (await db(`${rowPath(key)}&select=payload`)).json();
    return rows[0]?.payload ?? null;
  },
  async insert(key, value) {
    await db('api_cache?on_conflict=cache_key', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: body(key, value) });
  },
  async replace(key, revision, value) {
    const r = await db(`${rowPath(key)}&payload->>revision=eq.${encodeURIComponent(revision)}`, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: body(key, value),
    });
    return (await r.json()).length === 1;
  },
};

/** Reserve the remaining daily allowance atomically. One active call per account. */
export async function reserveVoice(key: string, store = budgetStore, now = Date.now()): Promise<VoiceLease> {
  await store.insert(key, fresh(now));
  for (let attempt = 0; attempt < 8; attempt++) {
    const old = await store.read(key);
    if (!old || !Number.isFinite(old.used) || old.used < 0) throw new BudgetError('voice_unavailable');
    // Even an expired lease blocks another call until its server owner or the
    // recovery sweep has confirmed hangup. Never grant overlapping provider calls.
    if (old.lease) throw new BudgetError('voice_busy');
    const current = old.day === utcDay(now) ? old : fresh(now);
    const remaining = DAILY_VOICE_MS - current.used;
    if (remaining < 1000) throw new BudgetError('voice_daily_limit');
    const lease: VoiceLease = { id: randomUUID(), start: now, deadline: Math.min(now + remaining, resetAt(now)), reserved: remaining };
    if (await store.replace(key, old.revision, { ...current, revision: randomUUID(), used: DAILY_VOICE_MS, lease })) return lease;
  }
  throw new BudgetError('voice_busy');
}
export async function attachVoiceCall(key: string, leaseId: string, callId: string, store = budgetStore) {
  const old = await store.read(key);
  if (!old?.lease || old.lease.id !== leaseId) throw new BudgetError('voice_unavailable');
  if (!await store.replace(key, old.revision, { ...old, revision: randomUUID(), lease: { ...old.lease, callId } })) throw new BudgetError('voice_unavailable');
}
/** Call only AFTER confirmed provider hangup (or a definitive failed creation). */
export async function releaseVoice(key: string, leaseId: string, store = budgetStore, now = Date.now(), failedCreation = false) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const old = await store.read(key);
    if (!old?.lease || old.lease.id !== leaseId) return;
    const charged = failedCreation ? 0 : Math.min(old.lease.reserved, Math.max(1000, now - old.lease.start));
    const value = { ...old, revision: randomUUID(), used: Math.max(0, old.used - old.lease.reserved + charged), lease: null };
    if (await store.replace(key, old.revision, value)) return;
  }
  throw new BudgetError('voice_unavailable');
}
export async function expiredVoiceLeases() {
  const r = await db(`api_cache?cache_key=like.voice-budget:v1:*&payload->lease->>deadline=lt.${Date.now()}&select=cache_key,payload&limit=100`);
  return await r.json() as Array<{ cache_key: string; payload: VoiceBudget }>;
}
