# Bobby iOS — resubmission handoff

Date: 2026-08-28  
iOS commit: `dc30d8931201e3d0132e45187198cc7c48bdfc95`  
Version: `1.0 (6)`

## Completed

- Backend POST asset search is deployed and returns `Cache-Control: no-store`.
- The iOS client sends all three free-form asset searches in POST bodies.
- The published privacy policy accurately describes Apple on-device/server speech behavior.
- The permanent in-app Privacy Policy link is present.
- App Privacy declares Device ID, not linked to identity, App Functionality, not tracking.
- Review notes explain the salted, truncated IP-derived rate-limit key and ten-minute expiry.
- Release build succeeded.
- All three StoreShots UI tests passed.
- Ten clean English 6.9-inch screenshots were generated at 1320×2868.
- Signed device archive created successfully.
- Archive passed local signature, bundle, privacy-manifest, arm64, and dSYM checks.
- Xcode Organizer/App Store Connect validation passed every check.
- Build `1.0 (6)` uploaded successfully to App Store Connect.
- Build `1.0 (6)` selected for the App Store version.
- Five final 6.9-inch screenshots uploaded and verified; the three old 6.5-inch
  screenshots were removed, so smaller devices use the new 6.9-inch set.
- Review notes were updated to match App Privacy: Device ID, App Functionality,
  not linked to identity, and not used for tracking.
- Bobby `1.0 (6)` was resubmitted to App Review on 2026-08-29 at 21:25 WEST.
- App Store Connect final state: **Pending Review** (`Pendiente de revisión`).

## Archive

`~/Library/Developer/Xcode/Archives/2026-08-28/Bobby 28-08-26, build 6.xcarchive`

Verified properties:

- Bundle ID: `xyz.bobbyprotocol.bobby`
- Version/build: `1.0 (6)`
- Minimum iOS: 17.0
- Architecture: arm64
- Team: `QZRTV6CMTT`
- App privacy manifest: valid
- GLTFKit2 privacy manifest: valid
- English and Spanish permission strings: present
- Binary/dSYM UUID: `DEEE6D0C-727F-3326-8918-10E8C3F951D3`

## Screenshots

Folder: `docs/app-store/store-shots-build6/`

Upload these five in this order:

1. `05-desk-companion.png`
2. `09-verdict.png`
3. `10-evolution.png`
4. `01-choose-companion.png`
5. `06-squad.png`

The original captures of squad and suggestions were discarded after visual QA because iOS overlaid an Apple Intelligence notification and keyboard tutorial. The files in the final folder are clean reruns.

## App Store Connect submission state

Submission completed on 2026-08-29:

1. Build 6 is attached to iOS version 1.0.
2. The five final screenshots are active in the documented order.
3. Metadata, App Privacy, and corrected review notes were verified.
4. The unresolved 4.3(a) submission was resubmitted successfully.
5. App Store Connect shows `App for iOS 1.0 (6)` as **Pending Review**.

No further action is required until Apple responds. Do not submit Makai before
the Bobby decision.

## Independent Kimi K3 audit

Session: `session_8410f155-85c5-41ad-9b44-d67f591610e9`

Kimi K3 performed a final read-only audit of the iOS source, build 6 archive,
production backend, privacy policy, screenshots, appeal documents, and a sampled
Bobby-versus-Makai comparison.

Verdict: **GO to resubmit Bobby. No new blockers found.**

Directly reverified:

- Archive `1.0 (6)`, bundle ID, signing team, arm64 binary, dSYM UUID, privacy
  manifests, and English/Spanish permission resources.
- Production POST asset search returns `200` and `Cache-Control: no-store`.
- Speech recognition behavior matches the published privacy policy: on-device
  when supported, otherwise processed by Apple, never by Bobby's servers.
- Permanent post-onboarding privacy link is present.
- Final screenshots are real English UI at 1320x2868; the verdict visibly shows
  the NO TRADE risk gate.
- Sampled SurfMoments/Makai source contains no Bobby references or evidence of
  repackaged product code.

Residual P3 items (not submission blockers):

1. The currently checked-out web branch is one commit behind `origin/main`; the
   live production deployment and `origin/main` both contain the correct POST
   privacy fix. Do not deploy the stale branch without updating it.
2. Rate-limit records have a ten-minute logical expiry, but no physical cleanup
   job for expired `api_cache` rows was found. The stored value remains a salted,
   truncated, non-linked hash and is already declared in App Privacy. Add a purge
   job after submission; do not change build 6 for this.
3. The current screenshots prove the risk gate but do not explicitly show the
   Alpha Hunter / Red Team / CIO disagreement. Keep this set for the resubmission;
   produce a debate-specific frame only if Apple rejects again.

Final recommendation for Claude: select processed build 6, upload screenshots in
the documented `05 -> 09 -> 10 -> 01 -> 06` order, verify metadata/privacy/review
notes after reload, submit Bobby with the prepared 4.3(a) response, and wait for
Apple's Bobby decision before resubmitting Makai.
