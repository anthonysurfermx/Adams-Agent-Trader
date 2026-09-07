#!/usr/bin/env node
// Generates the "Secret Key (for OAuth)" that Supabase's Apple provider needs
// for the WEB sign-in flow. It is a JWT signed with your Sign in with Apple
// private key (.p8) and it EXPIRES: Apple caps it at 6 months, so put a
// reminder to re-run this before it lapses (Supabase shows the expiry).
//
// Nothing here is stored or sent anywhere — it prints the token and exits.
//
//   node scripts/apple-client-secret.mjs \
//     --team  ABCDE12345            # Apple Developer Team ID
//     --key   XYZ9876543            # Key ID of the .p8 (Certificates → Keys)
//     --client xyz.bobbyprotocol.web # the Services ID (NOT the iOS bundle id)
//     --p8    ~/Downloads/AuthKey_XYZ9876543.p8
//
// Then paste the printed token into Supabase → Authentication → Providers →
// Apple → "Secret Key (for OAuth)" and Save.
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith('--') ? [a.slice(2), all[i + 1]] : []).filter(Boolean));
const { team, key, client, p8 } = args;
if (!team || !key || !client || !p8) {
  console.error('usage: --team TEAMID --key KEYID --client SERVICES_ID --p8 path/to/AuthKey.p8');
  process.exit(1);
}

const b64url = (input) => Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const header = { alg: 'ES256', kid: key, typ: 'JWT' };
const payload = { iss: team, iat: now, exp: now + 60 * 60 * 24 * 180 - 60, aud: 'https://appleid.apple.com', sub: client };
const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const privateKey = createPrivateKey(readFileSync(p8.replace(/^~/, process.env.HOME ?? '~'), 'utf8'));
// Apple wants the raw (r||s) ES256 signature, not DER.
const signature = sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' });
process.stdout.write(`${signingInput}.${b64url(signature)}\n`);
console.error(`\nexpires ${new Date(payload.exp * 1000).toISOString().slice(0, 10)} — set a reminder to regenerate before then.`);
