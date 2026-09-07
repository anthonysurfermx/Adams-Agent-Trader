// GET /api/waitlist-export — the iPhone early-access list, for the Google Sheet.
//
// The sheet pulls from here every 30 minutes through an Apps Script trigger
// (docs/ops/waitlist-google-sheet.md). Pulling means no Google service-account
// key has to live in this deployment; the only secret is the bearer token
// below, which is shared with the script.
//
// This endpoint returns personal data (email addresses), so it is fail-closed:
// with no WAITLIST_EXPORT_TOKEN configured it serves nothing at all.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { bobbyDbUrl, bobbyServiceKey } from './_lib/bobby-db.js';

export const config = { maxDuration: 30 };

const MAX_ROWS = 5000;

/** Constant-time compare that does not leak the token length. */
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function bearerFrom(req: VercelRequest): string {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return '';
  const prefix = 'bearer ';
  if (header.slice(0, prefix.length).toLowerCase() !== prefix) return '';
  return header.slice(prefix.length).trim();
}

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const expected = (process.env.WAITLIST_EXPORT_TOKEN || '').trim();
  if (!expected) {
    console.error('[WaitlistExport] WAITLIST_EXPORT_TOKEN is not set — refusing to serve the list');
    return res.status(503).json({ error: 'Export is not configured' });
  }
  if (!tokenMatches(bearerFrom(req), expected)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient(bobbyDbUrl(), bobbyServiceKey());
  } catch {
    return res.status(503).json({ error: 'Export is temporarily unavailable' });
  }

  const { data, error } = await supabase
    .from('bobby_early_access')
    .select('email, language, source_page, campaign, referrer, consent, consent_at, created_at, unsubscribed_at')
    .order('created_at', { ascending: true })
    .limit(MAX_ROWS);

  if (error) {
    console.error('[WaitlistExport] read failed:', error.code, error.message);
    return res.status(503).json({ error: 'Export is temporarily unavailable' });
  }

  const rows = data ?? [];
  // The list is never cached at the edge: it is personal data behind a bearer.
  res.setHeader('Cache-Control', 'no-store, private');

  const columns = ['email', 'language', 'source_page', 'campaign', 'referrer', 'consent', 'consent_at', 'created_at', 'unsubscribed_at'] as const;

  if (String(req.query.format || '').toLowerCase() === 'csv') {
    const lines = [columns.join(',')];
    for (const row of rows) lines.push(columns.map((key) => csvCell((row as Record<string, unknown>)[key])).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(lines.join('\n'));
  }

  return res.status(200).json({
    ok: true,
    generatedAt: new Date().toISOString(),
    count: rows.length,
    truncated: rows.length >= MAX_ROWS,
    columns,
    rows,
  });
}
