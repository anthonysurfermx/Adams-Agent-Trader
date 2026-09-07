# Kimi K3 independent App Store rejection audit

You are the independent adversarial reviewer. Work read-only: do not edit files,
do not submit anything, and do not change App Store Connect or git state.

## Objective

Investigate why Apple rejected Bobby under Guideline 4.3(a) (Design — Spam), find
risks missed by Codex and Claude, and decide exactly what must be changed or proven
before resubmission. Also identify likely *next* rejection grounds that could appear
after 4.3(a) is cleared.

## Known rejection

Apple wrote that the app shares a similar binary, metadata, and/or concept with apps
submitted by other developers, with only minor differences. The developer account
screen showed Bobby and Makai rejected; unrelated apps were also present.

## Evidence to inspect

- `docs/app-store/appeal-4.3a/BACKUP-metadata-pre-appeal.md`
- `docs/app-store/appeal-4.3a/reply-to-app-review.md`
- `docs/app-store/appeal-4.3a/screenshot-shotlist-v4.md`
- `docs/app-store/final-v3/contact-sheet.jpg`
- `docs/app-store/final-v4/contact-sheet.jpg`
- all three PNGs in `docs/app-store/final-v4/`
- English simulator captures in `docs/app-store/ui-captures/*-en.png`
- `scripts/build-app-store-appeal-screenshots.mjs`
- Native iOS source at git ref `ios/companion-bond` (commit `5e5090c`). The iOS
  directory is not checked out in the current worktree; inspect it with `git show`,
  `git ls-tree`, or a temporary detached worktree if genuinely needed.
- Local `/Users/mrrobot/Documents/GitHub/makai-landing` exists, but no Makai iOS
  project has yet been found. Search read-only for it and state clearly if absent.
- Original rejection screenshots:
  `/Users/mrrobot/Desktop/Captura de pantalla 2026-08-28 a las 12.44.52 p. m..png`
  `/Users/mrrobot/Desktop/Captura de pantalla 2026-08-28 a las 12.45.03 p. m..png`

## Facts already established

- Bobby is a native SwiftUI/XcodeGen app, not a web wrapper.
- It uses GLTFKit2 for GLB mascots.
- A real English simulator run succeeded for desk, live chart and NO TRADE states.
- Individual user queries do **not** mint an on-chain receipt. Public Bobby calls may
  be published on-chain. Never conflate those claims.
- The seven lifestyle screenshots were removed. Three replacement screenshots show
  real English UI at 1284×2778.

## Required investigation

1. Check current official Apple guidance for 4.3(a), 4.2, 2.3, financial-services
   rules, privacy/account requirements, AI-generated content, payments/IAP, and any
   other rule plausibly triggered by this binary or metadata. Prefer current official
   Apple sources; clearly label forum anecdotes.
2. Inspect the actual Swift source, assets, package structure, project settings,
   Bundle ID/team identifiers and commit history for template/binary similarity clues.
3. Look for duplicate app icons, duplicated asset catalogs, boilerplate, third-party
   code/assets, generic metadata, saturated-category framing, or contradictions.
4. Audit every factual claim in the appeal against the code and available evidence.
   Flag anything unproven, overly absolute, misleading or likely to provoke scrutiny.
5. Audit final-v4 screenshots for App Store dimensions, language, UI truthfulness,
   legibility, repetition and whether they really demonstrate differentiation.
6. Determine what can and cannot be concluded about Makai. Do not invent evidence.
7. Identify likely next rejection reasons after 4.3(a), with concrete mitigations.
8. Give a GO / CONDITIONAL GO / NO-GO verdict for resubmission.

## Output format

- Executive verdict
- New findings Codex/Claude may have missed, ranked P0/P1/P2
- 4.3(a) root-cause assessment with confidence percentages
- Appeal claim-by-claim truth table
- Screenshot/metadata review
- Likely next-rejection checklist
- Exact required changes before resubmission
- Exact optional improvements
- Questions that require Anthony or Apple to answer
- Final message for Claude, concise and operational

For every finding, cite the local file/line or external source. Separate verified
facts, reasonable inference and unknowns. Do not make changes yourself.
