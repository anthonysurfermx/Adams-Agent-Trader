# Bobby iOS — Final handoff for Claude

Date: 2026-08-28  
Current decision: **NO-GO for immediate resubmission. CONDITIONAL GO after the required fixes below.**

## Executive summary

Apple rejected Bobby under Guideline 4.3(a), saying the binary, metadata, and/or concept resembles apps submitted by other developers. The strongest working hypothesis remains that the original generic positioning (`Bobby- Financial AI Assistant`) and lifestyle-heavy product page made Bobby look like another repackaged AI/crypto companion. Makai/Surf Moments has now been located and compared directly with Bobby; no meaningful binary, source, asset, dependency, or template similarity was found between them. Apple still does not identify which signal triggered the rejection, so similarity to an unknown third-party app cannot be ruled out.

The product-page cleanup was directionally correct: the seven lifestyle frames were removed and three screenshots based on real native UI were produced. An independent Kimi K3 audit then found four concrete pre-submission issues: English screenshots still leak a Spanish locale, privacy compliance is incomplete or unverified, the iOS branch contains duplicate AppIcon catalogs, and the screenshots still do not show Bobby's defining three-agent debate.

Do not resubmit the current build and screenshots unchanged. Fix and verify the P0/P1 items first, then send a concise appeal asking Apple to identify whether its similarity signal concerns the binary, metadata, assets, or concept.

## What was tested and verified

- The Bobby iOS app is native SwiftUI, not a web wrapper.
- Native simulator flows were exercised on the `ios/companion-bond` ref.
- The verdict/evolution UI test passed and produced a real `NO TRADE` capture.
- Additional real English captures were made for the market desk and chart views.
- The onboarding test did not execute its intended first-run path because the simulator retained onboarded state. This was a test-state problem, not evidence of an app defect.
- The three Base mainnet contract addresses cited by the appeal return deployed bytecode:
  - TrackRecord: `0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321`
  - ConvictionOracle: `0x27f51D711171c830dd796D4B03914a8C6c46D75e`
  - AgentRegistry: `0xB3137D7afE26fbdBcAA95573C7A20be896efde93`
- Safe `0x8BE60853F27b944e11486285d95c3e06596553b4` reports a 2-of-3 threshold and three owners.
- These facts support claims about Bobby's **public market calls and public on-chain track record**. They do not support saying that every private user query receives an individual on-chain receipt; the app explicitly says it does not.

## Required before resubmission

### P0 — App privacy and data disclosure

1. Add an accessible Privacy Policy link inside the iOS app, not only in App Store Connect.
2. Add and validate `PrivacyInfo.xcprivacy` for Required Reason APIs. The code uses `UserDefaults`, so the manifest must declare an Apple-approved reason that accurately describes its use.
3. Localize microphone and speech-recognition purpose strings in English and Spanish. The project configuration currently has Spanish-only descriptions.
4. Reconcile the App Privacy questionnaire in App Store Connect with actual collection and transmission behavior.
5. If voice/text or identifiers are sent to a third-party AI provider, disclose what is sent, name or clearly identify the third-party processing, and obtain explicit permission before sending personal data where Apple's rules require it.

Apple references: [App Review Guidelines 5.1.1 and 5.1.2](https://developer.apple.com/app-store/review/guidelines/), [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files), [TN3183: Adding required reason API entries](https://developer.apple.com/documentation/technotes/tn3183-adding-required-reason-api-entries-to-your-privacy-manifest), and [Describing use of required reason APIs](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api).

### P0 — Repair and recapture the English product page

1. Replace the hardcoded `Locale(identifier: "es_MX")` in `ChartView.swift` with the app/device locale or a correctly injected locale. It appears in timestamp formatting on the iOS branch.
2. Audit server-provided/user-visible labels for Spanish leakage such as `ALCISTA` when the app is running in English.
3. Recapture all English screenshots after the fix. The current `final-v4` images must not be uploaded to the English storefront as-is.
4. Make one of the first three screenshots show the actual Alpha Hunter / Red Team / CIO disagreement and risk-gate result. This is the strongest visual evidence that Bobby is not a generic chatbot/template.
5. Keep screenshots grounded in real app UI. Avoid returning to lifestyle-only frames or unsupported claims.

### P1 — Remove duplicate AppIcon resources

The iOS ref contains two different AppIcon catalogs:

- `ios/Bobby/Assets.xcassets/AppIcon.appiconset/`
- `ios/Bobby/Sources/Assets.xcassets/AppIcon.appiconset/`

Their 1024px icons are not identical and the build emitted duplicate AppIcon warnings. Select `ios/Bobby/Assets.xcassets/` as the canonical catalog, remove `ios/Bobby/Sources/Assets.xcassets/` from the project, clean-build, archive, and confirm the warning is gone. The duplicate catalog contains the only byte-identical file found between the Bobby and Makai source trees: a generic XcodeGen `AppIcon.appiconset/Contents.json`. Removing it therefore resolves both the warning and the sole shared boilerplate artifact.

### Resolved — Makai/Surf Moments comparison

Makai's internal project name is Surf Moments. Its source is at `/Users/mrrobot/Surf moments/SurfMoments`, and archive `Makai-0.5.0-34.xcarchive` was compared with Bobby archive `Bobby 24-08-26, 2.44 PM.xcarchive` and Bobby's `ios/companion-bond` source ref.

- Bundle identifiers differ: `com.surfmoments.app` vs `xyz.bobbyprotocol.bobby`.
- App bundles differ materially in size and contents: approximately 9 MB for Makai vs 26 MB for Bobby.
- Executable, compiled asset catalog, and icon SHA-256 hashes differ.
- Makai links location, maps, photos, Vision, authentication, notifications, and CryptoKit. Bobby links speech, audio, Charts, SceneKit, and an embedded GLTFKit2 framework.
- Makai contains beach photography assets; Bobby contains ten 3D companion models and thumbnails. No shared product assets were found.
- Across the 45 compared project files, only one file is byte-identical: `Sources/Assets.xcassets/AppIcon.appiconset/Contents.json` (SHA-1 prefix `9ad64526`), generic asset-catalog boilerplate inside Bobby's duplicate catalog. The canonical Bobby AppIcon catalog does not match Makai.
- Five filenames overlap: `.gitignore`, `Contents.json`, `Theme.swift`, `icon-1024.png`, and `project.yml`. All are generic names; the files' substantive contents differ except for the boilerplate `Contents.json` above.
- No complete Swift file has an identical hash. Only 2 Bobby type names out of 34 also occur among Makai's 125 types: `Theme` and `ChatMessage`. Their implementations and data models differ.
- `Theme.swift` is 77 lines in Bobby and 243 in Makai, with no shared symbols beyond generic declarations such as `enum Theme` and `extension View`.
- Bobby's `ChatMessage` is a small three-field conversation model; Makai's is a separate five-field, session-oriented `Codable` model with different responsibilities.
- A normalized line-overlap check found no suspicious near-duplicate source pair.
- Their entitlements and privacy resources differ. Makai includes Sign in with Apple, push notifications, and a privacy manifest; the Bobby archive lacks a privacy manifest.
- The only common setup is normal for two apps from one developer: the same signing team and build machine, XcodeGen, SwiftUI, Swift 5.9, iOS 17, a flat `Sources/` layout, and generated Info.plist files. Nine build-setting keys overlap (`ASSETCATALOG_COMPILER_APPICON_NAME`, `GENERATE_INFOPLIST_FILE`, `CODE_SIGN_STYLE`, `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`, `PRODUCT_BUNDLE_IDENTIFIER`, `DEVELOPMENT_TEAM`, `SWIFT_VERSION`, and `TARGETED_DEVICE_FAMILY`), but their product-specific values differ where expected. This is standard project infrastructure, not repackaged product code.

Conclusion: **Makai is not a credible source of Bobby's 4.3(a) similarity signal based on the compared archives and source.** Makai's current source is one build newer than archive 34, so avoid claiming source-to-archive bit identity. It is nevertheless safe to state that the two products have independent executables, assets, dependencies, codebases, concepts, and functionality. Continue asking Apple whether an unidentified third-party binary, metadata set, assets, or concept triggered the rule.

### P1 — Verify the actual App Store Connect state

Before pressing Submit:

- Confirm the revised app name, subtitle, description, keywords, category, screenshots, privacy answers, review notes, and selected build are all saved on the same version submission.
- Confirm only screenshots from the final verified set remain in every required localization and device-size slot.
- Review the product page after a full reload; do not rely on an unsaved editor state.

## Appeal position

### Claims that are safe

- Bobby is a first-party native SwiftUI product with its own navigation, companion system, voice interaction, market views, three-agent debate, risk gate, and public performance record.
- It is an analysis/education product and does not execute trades or custody funds.
- Public Bobby calls can be verified against the cited Base contracts and 2-of-3 Safe.
- A direct comparison shows Makai and Bobby are independent native products with different executables, assets, code, dependencies, concepts, and functionality.
- The earlier metadata and screenshots did not clearly communicate Bobby's distinctive functionality; they have been revised.

### Claims to avoid

- Do not say Apple made a mistake or that Bobby cannot resemble any third-party app. The Makai comparison is resolved, but Apple's undisclosed comparison target and signal remain unknown.
- Do not say every user query is written on-chain or receives a receipt.
- Do not call Bobby a broker, investment adviser, automated trader, money manager, or execution platform.
- Do not overstate decentralization or imply that the contracts prove the complete app binary is unique.

### Recommended request to App Review

Explain the concrete native differences, acknowledge that the old presentation may have obscured them, and ask App Review to clarify whether the 4.3(a) signal concerns the binary, metadata, assets, or concept. Offer source/project provenance or a guided review path if needed.

## Secondary risk review

- **Guideline 4.2 / minimum functionality:** Bobby has defensible native depth, but review notes and screenshots must make it obvious. Give the reviewer a short path to voice, debate, verdict, chart, evolution, and public record.
- **Financial-services scrutiny:** Guideline 3.2.1(viii) can create extra friction for trading/investment apps submitted by an individual account. Keep the product framed truthfully as analysis and education with no execution/custody. Consider `Education` as the primary category only if it accurately represents the product.
- **Third-party branding:** Verify that any visible OKX name/logo is necessary, accurate, and permitted. Remove it from marketing screenshots if authorization or necessity is unclear.
- **Screenshot polish:** A consistent status-bar time such as 9:41 is optional polish, not an App Review blocker.

Apple references: [App Review Guidelines 3.2.1, 4.2, 4.3, and 5.1](https://developer.apple.com/app-store/review/guidelines/) and [Common App Review issues](https://developer.apple.com/app-store/review/).

## Suggested order of work for Claude

1. Locate the exact iOS worktree/ref and preserve unrelated changes.
2. Implement privacy link, privacy manifest, localized permission strings, and any required AI data consent.
3. Fix locale handling and audit English strings.
4. remove the duplicate AppIcon catalog and confirm a clean archive.
5. Run the native UI tests from a reset simulator state.
6. Capture a real three-agent debate plus two complementary native screens.
7. Rebuild the App Store screenshot set and visually inspect every image at full resolution.
8. Add the completed Makai comparison to the appeal only as concise supporting evidence; do not overwhelm App Review with raw hashes unless requested.
9. Update App Store Connect metadata, privacy answers, review notes, screenshots, and build; reload and verify.
10. Send the appeal and resubmit only after the checklist passes.

## Definition of done

Resubmission is a GO only when all of the following are true:

- [ ] Privacy Policy is linked in-app and in App Store Connect.
- [ ] `PrivacyInfo.xcprivacy` is present, accurate, and included in the archive.
- [ ] Microphone/speech descriptions and all screenshot UI are correctly localized.
- [ ] App Privacy answers and third-party AI disclosure/consent match actual behavior.
- [ ] Only one canonical AppIcon catalog is built, with no duplicate warning.
- [ ] At least one of the first three screenshots visibly demonstrates the three-agent debate/risk gate.
- [ ] All screenshots come from the verified current build and contain no mixed-language UI.
- [x] Makai/Surf Moments source and archive provenance have been compared; no meaningful similarity to Bobby was found.
- [ ] App Store Connect metadata and screenshots survive a reload on the exact version being submitted.
- [ ] A clean archive/build and reset-state smoke test pass.

## Message to carry into Claude's next task

> Treat this as a pre-resubmission remediation, not a copy-only appeal. Start from this report and the existing appeal folder. Makai/Surf Moments has already been compared with Bobby and no meaningful binary, source, asset, dependency, or template similarity was found; preserve that conclusion without claiming knowledge of Apple's unidentified third-party comparison target. Fix the remaining P0/P1 issues in Bobby, verify them with a clean archive and reset simulator, regenerate the screenshots with a real three-agent debate, and revise the appeal so every claim is evidence-backed. Do not submit, publish, commit, or push without the user's explicit approval.

## Audit provenance

This handoff consolidates:

- direct inspection and simulator testing performed in this workspace;
- on-chain read-only verification against Base mainnet;
- official Apple documentation current on 2026-08-28; and
- an initial independent read-only audit performed with Kimi K3 (`kimi-code/k3`, session `session_b2755a0c-a691-4a4d-a6a1-39e799e1cc3f`); and
- a second Kimi K3 forensic comparison using the located Makai/Surf Moments source and both Xcode archives (`session_36b8c50a-0319-42f4-89ab-bea6131f72a1`).

Kimi's updated verdict was **CONDITIONAL GO**. It considers Makai-related binary/template similarity practically ruled out, while leaving similarity to an unknown third-party app unprovable without Apple's internal signal. Its approximate root-cause assessment is: generic metadata/concept 70–75%, unknown third-party binary/template similarity about 15%, and Makai-related similarity below 5%. These percentages are informed estimates, not facts supplied by Apple.
