# iOS 1.0 (21): native Realtime voice

The desk microphone now connects directly to GPT Realtime 2.1 using a short-lived
credential issued by Bobby. The selected companion stays on screen and reacts to
audio playback. Voice follows the user's spoken language and receives the current
asset and chart timeframe. Text input during a call uses the same session.

The existing voice-tool endpoint supplies market evidence; its canonical risk plan
owns native trade cards. This does not turn run_debate into three independent agent
runs. No trade is executed by native voice. Prompts, client session limits, and the
existing IP mint throttle are not authenticated spending quotas.

Sessions close on backgrounding, leaving the desk, opening another main surface,
an audio interruption, or after five minutes. Controls mute input and end voice.
The old greeting/TTS path is suppressed during Realtime playback.

## Validation

- Release archive, automatic signing: passed with Xcode 26.1.1, iOS target 17.0.
- RealtimeVoiceTests: 4 passed on iPhone 17 Pro simulator. Checks cover PCM decoding,
  screen-context validation, transcript preservation, and canonical risk gating.
- Native Foundation URLSessionWebSocketTask live smoke test: connected to production
  GPT Realtime 2.1 and received 160,800 bytes of PCM audio plus the Spanish transcript
  "Tienes BTC seleccionado en la pantalla." with the interface language set to en.
- Physical iPhone microphone, speaker, Bluetooth routing, and interruptions still
  need device verification; the transport smoke test does not verify those paths.
- Public audio privacy disclosure and the native permission text/manifest updated.

The first upload attempt used build 20, which Apple rejected as already occupied.
Build 21 is the replacement. Web changes ship independently on main; this native
branch starts from the existing external TestFlight 19 source and must not replace
main's newer web code wholesale.
