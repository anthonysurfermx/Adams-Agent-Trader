# Trader Land: growth guidance and map usability

Branch: `codex/trader-land-ux-growth`, based on `origin/main` at `57c18d4`.

## Changes

- Visible read → review → build explanation, separate practice/earned collections, context-specific next action, discovery progress, next piece and next review date.
- Guidance uses existing server rules: respected no-trade grants a bloomed route piece; reviewing a seed blooms it regardless of thesis outcome; the discovery route is finite. Land stays 8 × 8.
- Community appears before the art catalog. Labeled navigation, district filters, recent/variety sorting and a prompt to bring one design idea home support the social-discovery hypothesis. Sorting applies to the API's latest 24 published islands.
- Explore / Build / Center toolbar. Selecting an available piece starts its preview directly; Build mode lets a placed piece be selected for a move. Placement still requires confirmation, with cancel and undo available. Mobile Build prioritizes the collection.
- Scroll pans, pinch or Ctrl/Cmd + scroll zooms; +/− zoom and 0 centers. Wheel events over help/controls are left to those controls.
- Malformed gallery responses report an error, not an empty community. Art aliases no longer duplicate catalog cards.

## Validation

- Production build passed (API TypeScript + Vite; existing chunk-size warnings).
- Existing gesture suite: 38 passing geometry cases.
- Existing thesis suite: 66 passed, 0 failed.
- `npx tsx --tsconfig tsconfig.app.json scripts/test-trader-land-growth.tsx`: practice separation, review priority, ready pieces, pending seeds, finite route, disabled actions, malformed versus valid empty gallery.
- Targeted ESLint: no errors; two existing warnings in GatePage (audio cleanup ref and unused Diamond).
- Browser: desktop and 390 × 844 mobile; direct piece selection, arrow/R/Enter placement, mobile confirmation and undo, practice persistence across navigation, Explore/Build switching, community navigation and error/retry presentation.
- Full frontend TypeScript check reports existing errors elsewhere (e.g. VideoPlayer role comparison and AdamsChat speech recognition types); no reported errors in the changed Trader Land files.

## Limits and follow-up

No production publication or authenticated account mutations were performed. Populated community filtering and live earned-account flows still need an integration pass with available public/account data. The local Vite server does not proxy Trader Land APIs; the unavailable state was verified there.

This implements the incentive hypothesis through visible progress and design inspiration. It does not demonstrate a retention lift. After release, measure time to first placement, review completion, and visits followed by a return to building. Avoid rewarding visits, trading frequency or P&L.

Weekly account usage started at 93%; during validation it read 94%. These values are shared across tasks and rounded, so they are not an exact attribution to this task.
