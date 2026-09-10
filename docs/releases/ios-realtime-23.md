# iPhone 1.0 (23): free voice fallback

Keep three daily Live minutes per account, shared with the website. Paid plans
are postponed. When Live fails or the allowance expires, use the existing Apple
speech recognition and NeuralVoice path. Classic desk speech requests Edge only;
essential responses fall back to AVSpeech when synthesis fails or times out.

The companion, market screen and transcript remain in the same view. An unanswered
question stays available in the input. A compact Live / Free control changes the
microphone path; selecting Live alone does not open a provider session. Backgrounding,
opening another screen and manual close cancel dictation without submitting a
partial question. A 45-second watchdog handles an unresponsive Live connection or
requested answer.

Six RealtimeVoiceTests passed, including provider rejection to free mode, no fallback
on manual stop, pending-question preservation, language behavior and canonical risk
checks. Release archive completed successfully. Physical microphone testing still
requires installing this build on an iPhone.
