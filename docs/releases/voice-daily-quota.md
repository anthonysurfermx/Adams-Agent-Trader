# Account voice allowance — 2026-09-10

Live voice has 180 seconds per authenticated account per UTC day, shared by web and iOS build 22. Time includes call setup, listening, speaking and muted time. Closing the call preserves confirmed unused time. Text remains available.

The backend creates WebRTC calls directly and returns SDP, never provider credentials. A private api_cache row reserves the remaining allowance with an atomic revision check, allowing only one active call per account. A server-side WebSocket owner hangs up at the deadline; waitUntil keeps it alive after the SDP response. A minute recovery cron retries overdue calls. Quota is released only after a confirmed hangup. A provider/network failure can delay hangup; reservations remain blocked until recovery. This is a time allowance, not a guaranteed dollar ceiling. Extra accounts have independent allowances.

Legacy clients cannot mint ephemeral secrets. iPhone users need TestFlight build 22. No raw audio/transcripts are stored by the budget owner. Account timing data is stored in the private cache for up to three days. The production Bobby database service credential was restored from the existing Supabase project credential; no new API key was created.

Validation:
- Atomic concurrent reservations, reconnect balance, idempotent and stale stop, UTC rollover and fail-closed database behavior.
- API authentication gate and unchanged language/asset/model/output limits.
- Real OpenAI WebRTC call with a test account seeded with 15 seconds remaining: second connection rejected, provider hung up without a client timer, balance exhausted and lease released. Temporary auth user and quota row removed.
- Mobile browser UI: authentication before microphone, exit to text, countdown, stop request, media cleanup, avatar visible and no horizontal overflow.
- iOS unit tests and simulator build; release archive. Physical iPhone microphone/speaker interaction still needs device verification.
