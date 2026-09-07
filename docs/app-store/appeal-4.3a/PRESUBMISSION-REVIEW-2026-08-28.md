# Bobby iOS — final presubmission review

Date: 2026-08-28  
Reviewed branch/worktree: `ios/companion-bond` at `66fdf92`  
Decision: **NO-GO until the blockers below are closed.**

## Executive summary for Claude

The work addressing Guideline 4.3(a) is coherent: the app has distinct native SwiftUI product code, the duplicate asset catalog is gone, only product UI screenshots remain, and the Release build succeeds. The remaining blockers are not about spam; they are submission mechanics and privacy accuracy.

Do not submit the current archive as-is. First set the iOS build number to 6 or higher, correct the privacy policy and data-flow mismatch described below, expose the privacy policy somewhere permanently accessible after onboarding, and rerun the localized onboarding UI test.

## Blocking findings

### P0 — The source still builds as build 1

`ios/Bobby/project.yml` declares:

```yaml
MARKETING_VERSION: "1.0"
CURRENT_PROJECT_VERSION: "1"
```

The verified Release bundle also contains `CFBundleVersion = 1`. App Store Connect already has rejected build 5, so the next upload must be build 6 or higher. Change the XcodeGen source of truth, regenerate the project, archive, then inspect the archive's `Info.plist` before uploading.

### P0 — “Data Not Collected” is not safely defensible with the current request path

The iOS app sends the user's free-form text through a GET query string:

```swift
api/bobby-asset-search?q=<user query>
```

Vercel Runtime Logs expose `Request Path` and `Search Params` and retain runtime logs according to the account plan. Therefore the current statement in the public policy — “Server logs record errors only — never the content of your questions” — is not supported by the implementation/platform behavior.

Apple defines collection as off-device data accessible beyond the real-time request. Search terms retained in infrastructure logs can therefore require disclosure as Search History or Other User Content, for App Functionality and not tracking.

Preferred fix:

1. Change free-form asset resolution from GET query parameters to a POST JSON body, or resolve locally and send only the canonical ticker.
2. Confirm request bodies are not logged by application or infrastructure tooling.
3. Review actual Vercel log configuration and retention, including end-user IP processing.
4. Then either keep “Data Not Collected” only if the data is truly discarded after the live request, or declare the data types actually retained.
5. Make `PrivacyInfo.xcprivacy`, App Store Connect answers, and the published policy match the final behavior.

The production backend does correctly hash the IP before writing the rate-limit identity to Supabase. That protects the database row, but it does not by itself prove that Vercel retains no request/IP metadata.

### P0 — The published privacy policy incorrectly promises on-device speech

The policy says dictation uses “Apple’s on-device speech services.” The app creates `SFSpeechAudioBufferRecognitionRequest` but does not set `requiresOnDeviceRecognition = true`. Apple speech recognition may therefore use Apple's servers.

The new permission string is accurate: it says audio is processed by Apple's speech recognition. Make the policy equally accurate; say Apple Speech Recognition may process audio, without promising on-device processing. Apple states that developers do not disclose data collected by Apple itself in the App Privacy answers, but the user-facing description still must be truthful.

## Important before resubmission

### P1 — Privacy policy is only reachable during onboarding

The only in-app privacy link is in `CompanionOnboarding.swift`. After onboarding is completed, there is no persistent Settings/About/Legal route to it. Add an easily accessible Privacy Policy link to a persistent app screen.

### P1 — The onboarding UI test is not localized

On a freshly uninstalled iPhone 16e simulator, onboarding opened correctly in Spanish and displayed the button `HACER MI COMPANION`. The test failed because it looked only for the English `MAKE IT MY COMPANION` as a `StaticText`.

Update the test to accept the localized button (prefer a stable accessibility identifier rather than visible copy), then rerun the full suite. This is a test defect, not an observed onboarding defect.

### P1 — Service-provider wording should avoid an unsupported provider order

The policy describes OpenAI as the primary spoken voice and Microsoft Edge as a fallback. The server can select Edge based on budget/configuration, and the client has an Apple offline fallback. Describe the processors without promising a fixed primary/fallback order unless production configuration is verified.

## Checks that passed

- Release simulator build: **BUILD SUCCEEDED**.
- The built bundle contains `PrivacyInfo.xcprivacy`.
- The privacy manifest declares tracking false, an empty collected-data list, and the UserDefaults required-reason API entry.
- English and Spanish microphone/speech permission strings are bundled.
- Only one AppIcon asset catalog remains.
- The duplicate file that matched Makai's boilerplate AppIcon catalog is gone.
- Verdict/evolution UI test passed.
- Board/suggestions UI test passed.
- Fresh-install onboarding rendered successfully; only the English-only assertion failed.
- Production `bobby-asset-search` and browse endpoints returned HTTP 200 in smoke tests.
- The production rate limiter hashes the client IP before persistent storage.
- Bobby and Makai remain materially distinct in product code; shared XcodeGen settings are standard infrastructure, not evidence of repackaging.

## Required closure checklist

- [ ] Set `CURRENT_PROJECT_VERSION` to 6 or higher in `project.yml`.
- [ ] Regenerate the Xcode project and verify the archive reports build 6+.
- [ ] Stop putting free-form user questions in URL query parameters, or disclose the retained search/user content accurately.
- [ ] Verify actual Vercel logs and IP retention; update App Store privacy answers accordingly.
- [ ] Correct the policy's on-device speech claim.
- [ ] Add a persistent in-app Privacy Policy link.
- [ ] Make the onboarding UI test locale-independent and rerun all tests.
- [ ] Build/archive with distribution signing and validate the archive.
- [ ] Upload the new build, select it in App Store Connect, attach the three verified UI screenshots, and submit the 4.3(a) response.

## Submission decision

Once every checkbox above is closed and the signed archive validates, the app is ready to resubmit. There is no technical benefit to waiting several days between Bobby and Makai; submit Bobby first only to learn whether Apple's 4.3(a) concern is resolved, then use that feedback to reduce risk for Makai.
