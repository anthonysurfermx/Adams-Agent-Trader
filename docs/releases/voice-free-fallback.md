# Daily Live allowance and free voice fallback

Keep the existing three-minute daily Realtime allowance per signed-in account,
shared across web and iPhone and enforced by the server. No subscription or
checkout is introduced; the proposed paid plan is postponed.

When the allowance ends, setup fails, the provider rejects a response, the data
channel closes, or a requested answer does not start within 45 seconds, switch
to free voice. Manual hangup does not switch modes. Authentication and microphone
permission failures keep their actionable controls.

On the web, the free desk retains the selected companion, ticker, timeframe and
transcript. An unanswered question remains in the input. Browser dictation runs
the existing asset resolution and canonical market analysis, followed by speech.
Browsers without a recognition API can use keyboard dictation or text. The compact
Live / Free button chooses which microphone path to use.

Classic desk speech explicitly sends `mode: free`. The server restricts that mode
to Edge synthesis, regardless of paid credentials or deployment preference. If
Edge fails or takes longer than eight seconds, essential replies can use device
speech. This keeps the voice fallback independent of OpenAI credit. Data feeds
and the analysis backend still require their own network services.

Validation:
- `npm run test:realtime-session`: shared account quota, concurrency, reconnection,
  midnight rollover, provider hangup and authentication checks passed.
- `npx tsx scripts/test-free-voice.mts`: public endpoint succeeds through Edge;
  an Edge outage makes zero paid-provider requests and returns a client fallback.
- Browser integration checks at 390px and 1440px: signed-out free exit,
  quota expiry, setup 503, failed response, response timeout and manual close passed. Free dictation
  dispatches the asset analysis; a simulated Edge outage reaches device speech
  without reconnecting to Realtime. The companion canvas remains present.
- `npm run build` passed. The broader frontend type check still reports existing
  unrelated schema/type issues, including the pre-existing ThesisSnapshot import
  and three-argument awardDiscipline call in CompanionDesk.

Credit monitoring is separate from voice routing. Never infer API balance from
Codex usage or monthly spend. Confirm the organization tied to the production
credential before reporting its balance or sending the requested USD 50 alert.
