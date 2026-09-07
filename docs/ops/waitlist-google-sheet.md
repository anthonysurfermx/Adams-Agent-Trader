# Waitlist → email alert + Google Sheet

Two ways to know that somebody joined the iPhone early-access list on `/app`:
an email the moment it happens, and a Google Sheet that refreshes itself every
30 minutes.

Until this shipped there was no notification of any kind — no confirmation to
the subscriber, no alert to us. Signups only existed as rows in
`bobby_early_access`.

## 1. Email on every signup

`api/bobby-early-access.ts` sends one plain-text mail per signup through
[Resend](https://resend.com). It is best effort: the mail is sent after the row
is written, and any failure is logged and swallowed, so a provider outage can
never cost a signup.

Environment variables (Vercel → Settings → Environment Variables → Production):

| Variable | Required | What it is |
|---|---|---|
| `RESEND_API_KEY` | yes | API key from the Resend dashboard |
| `WAITLIST_NOTIFY_EMAIL` | yes | Where the alert goes. Comma-separate for several |
| `WAITLIST_NOTIFY_FROM` | no | Sender. Defaults to `Bobby <onboarding@resend.dev>` |

With `RESEND_API_KEY` or `WAITLIST_NOTIFY_EMAIL` missing, the notification is
skipped and the signup still succeeds.

**About the sender.** The default `onboarding@resend.dev` works with no setup
but Resend only delivers it to the address that owns the Resend account. To
send anywhere else, verify `bobbyprotocol.xyz` in Resend (add its DNS records)
and set `WAITLIST_NOTIFY_FROM` to something like
`Bobby <hello@bobbyprotocol.xyz>`.

## 2. The Google Sheet

The sheet **pulls** from `GET /api/waitlist-export` rather than the site pushing
into it. That way no Google service-account key has to live in the deployment;
the only shared secret is a bearer token.

### 2.1 Generate the token

```bash
openssl rand -hex 32
```

Set the same value in two places:

- Vercel, as `WAITLIST_EXPORT_TOKEN` (Production).
- The Apps Script, as a Script Property named `WAITLIST_TOKEN` (step 2.3).

With `WAITLIST_EXPORT_TOKEN` unset the endpoint is fail-closed and serves
nothing — it returns 503 rather than exposing the list.

### 2.2 The endpoint

`GET /api/waitlist-export`, `Authorization: Bearer <token>`.

Returns JSON by default, or CSV with `?format=csv`. Columns: `email`,
`language`, `source_page`, `campaign`, `referrer`, `consent`, `consent_at`,
`created_at`, `unsubscribed_at`. Capped at 5000 rows, oldest first, never
cached.

Check it by hand:

```bash
curl -s -H "Authorization: Bearer $WAITLIST_EXPORT_TOKEN" https://bobbyprotocol.xyz/api/waitlist-export
```

### 2.3 Wire the sheet

1. Open the sheet: **Bobby Waitlist** —
   <https://docs.google.com/spreadsheets/d/1SVDXPebnI4FA09-Yc8J2lulS7cO1CTfKTZwPpQAPr-Q/edit>
   (created 2026-09-07, owned by `anthochavez.ra@gmail.com`). The script writes
   a `Waitlist` tab and a `Status` tab; the tab the file was seeded with can be
   deleted once the first refresh runs.
2. Extensions → Apps Script. Replace the contents with the script below and save.
3. Project Settings → Script Properties → Add: `WAITLIST_TOKEN` = the token from
   step 2.1.
4. Back in the editor, pick `refreshWaitlist` and press Run once. Approve the
   permissions prompt. The sheet fills.
5. Run `createTrigger` once. That installs the 30-minute schedule. Running it
   again is safe — it clears its own old triggers first.

```javascript
const ENDPOINT = 'https://bobbyprotocol.xyz/api/waitlist-export';
const SHEET_NAME = 'Waitlist';

function refreshWaitlist() {
  const token = PropertiesService.getScriptProperties().getProperty('WAITLIST_TOKEN');
  if (!token) throw new Error('Script Property WAITLIST_TOKEN is not set');

  const response = UrlFetchApp.fetch(ENDPOINT, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code !== 200) throw new Error('waitlist-export returned ' + code + ': ' + response.getContentText().slice(0, 200));

  const payload = JSON.parse(response.getContentText());
  const columns = payload.columns;
  const rows = payload.rows || [];

  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);

  // Rebuild the whole tab so removals and unsubscribes are reflected too.
  sheet.clearContents();
  sheet.getRange(1, 1, 1, columns.length).setValues([columns]).setFontWeight('bold');
  if (rows.length > 0) {
    const values = rows.map(function (row) {
      return columns.map(function (key) {
        const value = row[key];
        return value === null || value === undefined ? '' : value;
      });
    });
    sheet.getRange(2, 1, values.length, columns.length).setValues(values);
  }
  sheet.setFrozenRows(1);

  const stamp = book.getSheetByName('Status') || book.insertSheet('Status');
  stamp.clearContents();
  stamp.getRange(1, 1, 3, 2).setValues([
    ['Last refresh', new Date()],
    ['Signups', rows.length],
    ['Source', ENDPOINT],
  ]);
}

function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'refreshWaitlist') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('refreshWaitlist').timeBased().everyMinutes(30).create();
}
```

## Known issue, unrelated to this

`api/bobby-early-access.ts` still mirrors every signup into
`newsletter_subscribers`, a table that does not exist in the `bobby-protocol`
Supabase project. The mirror therefore fails on every signup. It is harmless —
`bobby_early_access` is written first and the request still returns 200 — but it
logs an error each time. Either create the table or set
`BOBBY_EARLY_ACCESS_MIRROR_NEWSLETTER=false` to turn the mirror off.
