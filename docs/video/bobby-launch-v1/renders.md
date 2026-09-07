# Render log — bobby-launch-v1

| # | Date | Format | Model / mode | Res | Dur | Credits | Job id | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-09-03 | 9:16 | marketing_studio_video (no mode: `saas` / `saas_motion` rejected as "Invalid marketing studio preset type") | 720p | 15 s | 75 | 1e5b7d79-0104-4756-b59c-d1e3ac3e71e6 | MISFIRE: server defaulted `mode: "ugc"` and its enhanced_prompt rewrote the film into a UGC selfie (a creator holding a card with the Halo ring, spoken script). Local: `renders/bobby-launch-v1-9x16-r1.mp4` (gitignored), `renders/contact-sheet.png` |

Notes:
- `mode` slugs come from `marketing_list_video_presets`, which the MCP build in this session does not expose. `get_cost` does not validate `mode`. Prompt carries the full design world instead.
- 5 reference images passed as role `image`: byte, halo, glitch, 09-verdict, 05-desk-companion.
- 16:9 version NOT rendered yet: 480p 15 s = 52.5 credits, 720p 12 s = 60, 720p 15 s = 75. Balance after render 1 ≈ 71.8.

## Lesson from render 1
`marketing_studio_video` without a valid `mode` falls back to UGC and REWRITES the prompt
(see `params.enhanced_prompt` in the generation JSON). For a 3D CG launch film via MCP use a
direct model that honours the prompt verbatim (Seedance 2.5 `omni_reference` with image refs,
or Kling 3.0 multi-shot from a start frame), or pick the SaaS / Hypermotion preset inside the
Marketing Studio v2 widget by hand. The v2 motion formats (`saas_motion`, `hypermotion`,
`2d_motion`, `mixed_media`) use job_set_type `marketing_studio_v2_video`, which this MCP's
`generate_video` does not reach.

## Options priced after render 1 (balance 71.8)

| Route | Refs | Res / dur | Credits |
| --- | --- | --- | --- |
| Seedance 2.5 omni_reference 9:16 | several image refs (Byte/Halo/Glitch + screenshot) | 480p / 15 s | 37.5 |
| Seedance 2.5 omni_reference 9:16 | same | 720p / 10 s | 65 |
| Kling 3.0 std 9:16 | start_image only (2-credit storyboard frame first) | 15 s | 26.25 |
| Kling 3.0 pro 9:16 | same | 15 s | 30 |
| nano_banana_pro storyboard frame | image refs | 9:16 | 2 |

## Round 2 (user go-ahead: finish with remaining credits, product-focused)

| # | Date | Format | Model / mode | Res | Dur | Credits | Job id | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 2026-09-03 | 9:16 | nano_banana_pro storyboard hero frame, refs byte/halo/glitch/09-verdict | 1536×2752 | still | 2 | 46a128fb-8600-4d7c-bbfc-4759b09bd6b0 | PASS: Byte, Halo, Glitch, CASE/REFUTATION/RISK GATE slabs and headline all exact. `renders/storyboard-hero-9x16.png` |
| 3 | 2026-09-03 | 9:16 | seedance_2_5 omni_reference, refs: storyboard + byte + halo + glitch + 09-verdict; preset "IN THE DARK" declined (literal) | 480p | 15 s | 37.5 | 1403e43d-41dd-4200-b9b6-e9e8b7f106a2 | **PASS — the deliverable.** All 7 shots, every locked string rendered correctly (Is BTC a buy? / Everyone has the answer now. / SAME MODELS · SAME VOICE / Three agents. One verdict. / Glitch red flag → ? / NO TRADE + No setup yet. Capital protected. + +20 DISCIPLINE XP / RECORDED BEFORE THE OUTCOME + ON THE RECORD / Discipline levels you up. + GIGABYTE · LEVEL 4 · RISK GUARDIAN / Bobby + Ask. Then verify. + COMING SOON TO IPHONE). Characters match the app. Native 480×854; local lanczos upscale to 1080×1920 in `renders/bobby-launch-v1-9x16-r3-seedance-1080x1920.mp4`. Contact sheet `renders/contact-9x16-r3.png` |
| 4 | 2026-09-03 | 16:9 | nano_banana_pro storyboard hero frame, refs: 9:16 storyboard + byte + halo + glitch | 2752×1536 | still | 2 | fc3050e9-5f6f-43ff-9778-ed974b61f13e | PASS: headline left third, Byte + slabs right, Glitch + Halo placed. `renders/storyboard-hero-16x9.png` |
| 5 | 2026-09-03 | 16:9 | kling3_0 std, start_image = 16:9 storyboard frame; preset "3D RENDER" declined (literal); 6 shots starting on the hero frame | 15 s | 26.25 | 5b7222a8-29ef-4b3f-9c6a-a31a724035e8 | PARTIAL. Motion and characters good (chest pulse into slabs, Glitch macro, Halo shield, evolution ring). FAILS text lock: "RECRIIED BEOIRR THE TE OUTOME", "+20 DISFYLFCNL", "No seolup yej"; and the brand frame (Bobby / Ask. Then verify.) never appears — it ends on the evolution. Not publishable as-is. 1284×716. Contact sheet `renders/contact-16x9-r5.png` |

## Outcome 2026-09-03 (balance left: 4.05 credits)

- **9:16 Instagram/TikTok: DONE** — Seedance 2.5 omni_reference honoured the 7-shot script and the text lock at 480p. Upscaled locally to 1080×1920 for posting.
- **16:9 LinkedIn/X: NOT DONE** — Kling 3.0 std cannot hold long on-screen strings. Re-render with Seedance 2.5 omni_reference 16:9 using `prompt-16x9.txt` + the 16:9 storyboard frame (`fc3050e9-…`) as @Image1: 480p 15 s ≈ 37.5 cr, 720p ≈ 78 cr (verify with get_cost).
- Credits spent this session: 75 (misfire) + 2 + 37.5 + 2 + 26.25 = 142.75.

## Recipe that works (for the next product)
1. Upload real product evidence (screenshots + character/product refs) → media_confirm.
2. nano_banana_pro storyboard hero frame with those refs (2 cr) → approve.
3. seedance_2_5 `mode: omni_reference`, `image_references` = [storyboard, characters…, one real screenshot], full 7-shot prompt with TEXT LOCK, decline the preset recommendation (`declined_preset_id`) so it renders literally.
4. Never use `marketing_studio_video` via MCP without a validated `mode` (it silently falls back to UGC and rewrites the prompt).
5. Kling 3.0 only for shots without long text.
