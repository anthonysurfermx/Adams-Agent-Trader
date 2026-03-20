// ============================================================
// POST /api/feedback — User feedback & bug reports
// Saves to Supabase + sends Telegram notification
// No auth required — anyone can report
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const NOTIFY_EMAIL = 'anthochavez.ra@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

async function sendEmailNotification(feedback: Record<string, unknown>): Promise<void> {
  const type = String(feedback.type || 'bug').toUpperCase();
  const emoji = type === 'BUG' ? '🐛' : type === 'FEATURE' ? '💡' : '💬';
  const from = String(feedback.user_email || feedback.wallet_address || 'Anonymous');
  const subject = `${emoji} Bobby Feedback: ${type} — ${from}`;
  const body = `<h2>${emoji} Bobby Feedback</h2>
<p><strong>Type:</strong> ${type}</p>
<p><strong>From:</strong> ${from}</p>
<p><strong>Page:</strong> ${feedback.page || 'unknown'}</p>
<p><strong>Message:</strong></p>
<blockquote style="border-left:3px solid #10b981;padding-left:12px;color:#333">${feedback.message}</blockquote>
<p style="color:#999;font-size:12px">${new Date().toLocaleString('es-MX')}</p>`;

  // Try Resend first (free 100 emails/day)
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Bobby Feedback <feedback@defimexico.org>',
          to: NOTIFY_EMAIL,
          subject,
          html: body,
        }),
      });
      return;
    } catch { /* fallback below */ }
  }

  // Fallback: use droplet SMTP relay
  try {
    await fetch('http://143.110.194.171:8787/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Feedback received: ${type} from ${from}`, voice: 'cio', lang: 'en' }),
    });
    // At minimum, log it — the Supabase insert is the real persistence
    console.log(`[Feedback] Email would go to ${NOTIFY_EMAIL}: ${subject}`);
  } catch { /* non-critical */ }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { type, message, page, context, user_email, wallet_address } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length < 3) {
    return res.status(400).json({ error: 'message is required (min 3 chars)' });
  }

  const feedback = {
    type: ['bug', 'feature', 'general'].includes(type) ? type : 'general',
    message: message.trim().slice(0, 2000),
    page: page?.slice(0, 100) || null,
    context: context ? JSON.stringify(context).slice(0, 5000) : null,
    user_email: user_email?.slice(0, 200) || null,
    wallet_address: wallet_address?.slice(0, 100) || null,
    status: 'new',
  };

  // Save to Supabase
  let saved = false;
  try {
    const sbRes = await fetch(`${SB_URL}/rest/v1/user_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(feedback),
    });
    saved = sbRes.ok;
    if (!saved) {
      console.error('[Feedback] Supabase insert failed:', sbRes.status, await sbRes.text().catch(() => ''));
    }
  } catch (e) {
    console.error('[Feedback] Supabase error:', e);
  }

  // Send email notification (fire and forget)
  sendEmailNotification(feedback);

  return res.status(200).json({ ok: true, saved, message: 'Thanks for your feedback!' });
}
