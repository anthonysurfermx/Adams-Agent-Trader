# Bobby iOS 1.0 (22) — shared daily voice allowance

Uses native WebRTC with GPT Realtime 2.1, replacing client-owned WebSocket sessions. Bobby creates and owns the call; the iPhone receives SDP and an account lease, never a provider credential. Sign-in is required for voice. The same account has 180 seconds per UTC day shared with the web, including listening, speaking and muted time. A visible countdown follows the server allowance. Closing voice releases unused time after the backend confirms provider hangup. Text remains available.

The selected companion, automatic spoken language, chart context, technical evidence and debate callbacks are preserved. Avatar amplitude comes from WebRTC audio statistics. The privacy manifest marks audio as account-linked because calls now require account identity.

Requires web backend commit 3f3d497 or later. Older native builds cannot start a voice session with the new backend; install build 22 through TestFlight.

Validation: four RealtimeVoice unit tests passed, iPhone 17 Pro simulator build passed, Release archive signed successfully. The shared backend passed a live OpenAI WebRTC hangup test without a client timer. Real microphone/speaker behavior on a physical iPhone remains to be verified.
