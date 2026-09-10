# Realtime voice desk

The voice desk uses the companion progress store for avatar, gear and voice persona.
The desk microphone carries the selected symbol and chart interval into the call.
Voice language defaults to automatic detection, independently of the UI language.

## Current analysis path

- Price questions: `get_market`.
- Asset opinions: `run_debate` in `api/voice-tool.ts` fetches market data,
  one-hour technicals and desk intelligence. The browser deduplicates identical
  asset requests for 30 seconds.
- Realtime synthesizes that evidence into Alpha, Red Team and CIO perspectives.
  These are NOT three independently executed agent calls. The autonomous cycle
  in `api/bobby-cycle.ts` is a separate workflow, with privileged side effects;
  never expose that endpoint directly as a voice tool.
- Only symbol and chart interval are sent as screen context. Tool results supply
  actual prices and indicators. No continuous screenshots are sent. A 4H chart
  does not make the current technical brief a 4H analysis: that brief is 1H.

## Cost controls and their limits

The server configures 1,024 maximum output tokens per response, a 6,000-token
post-instruction conversation window with 0.8 retention, and a 60-second client
secret validity period. Expiry prevents new connections; it does not terminate
an existing call, and a secret can create more than one connection before expiry.

The standard browser closes calls after five minutes and releases audio tracks
on exit, language changes and connection failure. The mint endpoint throttles
8 requests per IP per 10 minutes and 20 per day. These are best-effort throttles:
the existing persistent limiter is non-atomic and fails open during DB failure.

Market-only instructions redirect unrelated conversation. Prompts, client-side
session configuration and browser timers are not adversarial security boundaries.
A modified client can bypass browser controls, including session settings.

## Production hardening still required before offering paid voice quotas

Authenticate callers, reserve usage atomically against account and global budgets,
limit concurrent calls, and own the call from a server process that can meter usage
and terminate it. Gate tool dispatch and analysis eligibility server-side. Refusing
an unrelated audio request still consumes transcription/model tokens.

Expose an isolated read-only independent-debate service if voice should request a
full three-agent debate. Cache results per asset/timeframe/data freshness, and let
Realtime narrate that authoritative result without rerunning it on every turn.
Keep this path separate from order execution and from the privileged cycle runner.

## Validation

`npm run test:realtime-session` mocks provider calls and checks automatic/fixed
language, context sanitization, voice compatibility, configured limits, and denied
requests without another mint. `npm run test:voice-brief` covers technical briefs.
Browser checks simulate microphone/WebRTC events; they do not prove real spoken
language detection or live model refusal reliability.
