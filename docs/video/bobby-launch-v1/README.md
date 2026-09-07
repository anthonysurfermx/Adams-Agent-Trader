# Bobby app — launch film v1 (Higgsfield Marketing Studio via MCP)

**Date:** 2026-09-03 · **Owner:** Anthony · **Status:** 9:16 delivered (Seedance 2.5, render 3); 16:9 pending re-render — see renders.md

Reference pipeline: Higgsfield blog "Claude Fable 5.1 + Higgsfield Marketing Studio"
(launch-video section, Tepsira example): one 15-second 3D CG product-launch film,
7 edited camera shots in one consistent design world, English on-screen text,
music + sound design, no voiceover. Rendered with `marketing_studio_video`,
mode `saas` (SaaS motion), 15 s.

## Product evidence used (real, not invented)

| Asset | Source | Role in film |
| --- | --- | --- |
| `docs/app-store/store-shots-build6/05-desk-companion.png` | real iOS build 6 screenshot | Live Desk + Byte companion, "Ask about BTC, NVDA, gold..." |
| `docs/app-store/store-shots-build6/09-verdict.png` | real screenshot, live BTC | Halo risk gate: NO TRADE / Capital protected / +20 Discipline XP |
| `docs/app-store/store-shots-build6/10-evolution.png` | real screenshot | Companion evolution: GIGABYTE · LEVEL 4 · RISK GUARDIAN |
| `docs/app-store/store-shots-build6/06-squad.png` | real screenshot | Bobby Squad 3D roster |
| `public/mascots/{byte,halo,orb,glitch}.webp` | the app's own 3D mascots (GLB thumbs) | character identity references |
| `docs/brand/bobby-character-bible.md` | design bible | materials, palette, signature motions |
| `docs/messaging/landing-copy-en.md` | v5 copy spine | every on-screen string |

Higgsfield media_ids (valid until 2026-09-04):

```
05-desk-companion  a9d0e9eb-1cf0-49c0-9299-83a154477bf9
09-verdict         74c53f35-5027-4780-b8ac-46061afec44b
10-evolution       0a27b13b-f77e-40ae-9de0-261c73ff4a24
06-squad           d6a6d0bc-9be2-4a09-ac29-f3c253cfe75f
byte               0465db1b-057f-4e42-9dcd-1e75522ae8be
halo               509c772d-9298-481d-94f0-c9c43b671f16
orb                e239f7a8-5d48-4f09-8c19-3db9f6b8022e
glitch             398f6529-de4a-4310-ac32-7540fd511b76
```

## Costs (measured 2026-09-03, balance 146.8 credits, plan Plus)

| Format | Res | Duration | Credits |
| --- | --- | --- | --- |
| 9:16 | 1080p | 15 s | 150 |
| 9:16 | 720p | 15 s | 75 |
| 9:16 | 480p | 15 s | 52.5 |
| 16:9 | 720p | 12 s | 60 |

## Story (15 s, 7 shots)

1. Hook — everyone already has the AI answer (stack of identical answer cards).
2. Byte pulls the answer into the three-slab debate: CASE / REFUTATION / RISK GATE.
3. Macro insert — Glitch pulls a red flag from a pixel tear (Red Team).
4. Halo snaps into shield: NO TRADE · Capital protected · +20 DISCIPLINE XP.
5. Macro insert — the call is stamped into a glass record page before the outcome.
6. Byte evolves: GIGABYTE · LEVEL 4 · RISK GUARDIAN.
7. Brand frame: Bobby · Ask. Then verify. · Coming soon to iPhone. Freeze 13.8–15.0.

On-screen strings are locked (see prompts). Nothing promises returns; the film
shows a NO TRADE verdict on purpose (brand rule: "it's allowed to say no").

## Prompts

- `prompt-9x16.txt` — Instagram Reels / TikTok / Shorts (safe zones top 12% / bottom 15%)
- `prompt-16x9.txt` — LinkedIn / X (same shots, wider staging, text left-third)

## Render log

See `renders.md`.
