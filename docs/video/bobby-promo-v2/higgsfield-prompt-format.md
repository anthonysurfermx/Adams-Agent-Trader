# Higgsfield's Seedance prompt format (from "Cinematic Car Commercial — Full Breakdown", 2026-09-04)

Source: https://higgsfield.ai/blog/ai-car-commercial-youtube-guide (Anthony's PDF). Every video there is Seedance;
stills with Nano Banana Pro / Seedream / Soul Cinema. Two layers: lock the ASSETS first (character sheets,
locations as "cleaned plates", props), then generate SCENES, one scene per generation, 3 to 7 cuts each.

## The prompt is one block with three labeled sections

```
— REFERENCE DEFINITIONS — @name: <long literal description of the asset: face, hair, wardrobe, colours,
what must match> — <what this reference is for: "Character appearance only" / "Exact vehicle design
reference: body shape, paint colour and wheels must match" / "Location, lighting and colour grade
reference; the sun itself is never in frame">. Reference. @next_name: ... Reference.

— TECHNICAL BLOCK — Photoreal. Cinematic. 16:9. 15s. SFX only, no music. Kodak 500T film grain, organic
colour, soft contrast, 8K. <light rule>. <camera rule: "static locked-off tripod shots only" or "multiple
cuts, rule of thirds">. Hard cuts between shots. NO CGI. NON-IP. Real-time playback, natural 1:1 speed.
<exclusions: "absolutely no people", "the roadway is completely clean of signage">.

— PROMPT — <one-line logline of the scene, with how many cuts and how long each>. Then CUT 1 — <name>:
<camera, lens, what is in frame at the start, what moves, what the light does>. CUT 2 — ... Every cut
names the lens/angle (200mm side, low three-quarter, top shot with descent), what the frame opens with
("the frame opens EMPTY"), and the exact event. Dialogue is written inline in the cut with the delivery
("she says, wary: 'Change?'", "sweating — 9/10 intensity"). Ends with: SFX only: <list of sounds in order>.
```

Other rules they use:
- Elements are named `@name` and defined ONCE in REFERENCE DEFINITIONS with a full literal description,
  then only referenced by name in the cuts. "Reference." closes each definition.
- Locations are "cleaned plates" (no people, no cars) so the scene can add exactly what it needs.
- A "fixed scene geography" block locks positions across cuts ("the car's lane", "she stays on the sidewalk").
- Screenshots from a previous video are reused as references to lock a position (@image_1 / @position);
  "the mark itself never renders".
- Text is controlled by negation: "no brand names, no text badges", "no readable text anywhere".
- Seedance 2.5 guide (higgsfield.ai/blog/seedance-2-5-prompting-guide): GLOBAL STYLE → SCENE → CHARACTERS →
  LOCATION → FIRST FRAME AND BLOCKING → SHOT-BY-SHOT with timestamps and "HARD CUT" → OPTICS → PHYSICS →
  LIGHTING → AUDIO. Dialogue: "At 5.4s she says, soft and unsteady: '…'". Lip sync: "she speaks on camera
  with accurate lip-sync". Average shot under 1.5 s, every beat with a moving camera.

## What this changes for the Bobby promo
1. Define every asset once, literally, at the top: @girl (char_cdmx_young), @byte, @street (loc + paving +
   median + facades), @phone, @bobby_screen (the real screenshot), @grey_chat.
2. TECHNICAL BLOCK with the axis rule, "no reverse angles", the crowd rule, text rules.
3. One PROMPT with CUT 1..N, each with lens, opening frame, event, timestamped dialogue with voice
   direction ("a second voice, female, clear General American accent, matter-of-fact: 'Like it does for
   everyone.'"), and the on-screen text of that cut only.
4. Close with SFX + music lines.
