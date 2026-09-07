# Bobby build 6 — verified App Store screenshots

Generated on 2026-08-28 from iOS commit `dc30d89` using the real app, the production backend, and a dedicated iPhone 17 Pro Max simulator.

## Verification

- All three `BobbyUITests/StoreShots` flows passed.
- All ten PNG files are exactly 1320×2868 pixels (App Store 6.9-inch class).
- Language is English.
- `09-verdict.png` uses a live BTC response from production.
- `10-evolution.png` was triggered by seeding Discipline XP to 395 in the isolated screenshot simulator.
- The first `06-squad` and `07-suggestions` attempts were rejected during visual QA because iOS overlaid an Apple Intelligence banner and keyboard tutorial. The files in this folder are clean reruns.
- No lifestyle artwork, marketing banner, device frame, or fabricated UI is present.

## Recommended upload order

Upload these five, in this order:

1. `05-desk-companion.png` — the actual product and companion.
2. `09-verdict.png` — NO TRADE risk gate, live BTC chart, and Discipline XP.
3. `10-evolution.png` — the companion evolves through discipline.
4. `01-choose-companion.png` — companion-first onboarding.
5. `06-squad.png` — real 3D roster, levels, and earned emotes.

The remaining five are alternates and supporting evidence. `07-suggestions.png` deliberately includes the normal iOS keyboard because it demonstrates search-as-you-type; it is not part of the recommended five.

## Source test results

The original result bundles remain outside the repository under `/tmp/bobby-shots-codex/` for local audit:

- `shots1.xcresult` / `shots1b.xcresult`
- `shots2.xcresult`
- `shots3.xcresult` / `shots3b.xcresult`

