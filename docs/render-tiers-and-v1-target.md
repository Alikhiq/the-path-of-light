# Render Tiers & the V1 Target Look (Revision 5 — realism pivot)
_"The Path of Light" / Bayt al-Nūr · Art direction by Fable 5._

**What this document supersedes:** the *render-fidelity doctrine* of Revision 4 and the old prompt
bible — PS1 wobble, Bayer dithering, texel budgets, blob shadows, low-poly tri counts. All of that
is retired. **What stands unchanged and non-negotiable:** real visible faces on ordinary (fictional)
people; the aura tier logic (§2 of `art-bible-faces-and-auras.md`); the Presence rig — the 14
Maʿṣūmīn, Allah, and the angels are light only, never a face, never a body, never a shadow; the
palette (navy #0B1B3A / #1E3A8A, gold #D9A84E / #F0C46B, teal #2B7A78, ochre #7A5C3E, near-black
#060B18); the two-light doctrine (lamp gold ~2200K vs. moon blue ~7000K); the scholar gate. The
sacred rules were never about polygon counts. They survive every rendering technology on earth.

---

## 1. The reframe — three different things wearing the same word

"Realistic" is being used for three products that have almost nothing to do with each other.
Untangling them dissolves most of the anxiety:

### A. The real-time playable game
Every frame must be computed **in under 16–33 milliseconds, on the player's own machine, forever,
while the player does unpredictable things.** This is the only category with a hardware ceiling,
and the ceiling is set by the *player's* GPU — not by anything we own. Our dev laptop (RTX 4060
Laptop, 8 GB VRAM, 16 GB RAM) is also our honest min-spec stand-in, and last night's test is the
ground truth: with Lumen GI + Nanite + ray tracing enabled, it could not hold framerate, so they
were disabled. That is not a settings mistake. **Full UE5 photorealism, walkable at 30–60 fps, is
not achievable on this class of hardware.** No purchase we make changes what runs on the player's
4060.

### B. AI-generated images and video (Gemini, Higgsfield)
Each image gets **unbounded compute and no interactivity.** An AI render is allowed to take thirty
seconds and be wrong about geometry from any other angle. It will *always* look more "real" than
any real-time frame — that is not the game falling short; it is two different physics. AI output is
for: concept art, marketing stills, key art, trailer shots, and AI-enhanced cinematics. It can
never be walked through.

### C. Offline pre-rendered cinematics (render farm)
Frames computed with **minutes per frame** — UE5 Movie Render Queue with the path tracer, or
maxed-out Lumen/RT settings — then played back as video. Movie-quality light transport is available
here *today, on hardware we already own*, because playback is just video: it runs on anything.

### What each asset actually buys

| Asset | What it buys | What it does NOT buy |
|---|---|---|
| **RTX 4060 Laptop (now)** | The v1 playable target (§2) at ~60 fps; the pushed ceiling (T5) at ~30 fps; authoring + testing at true min-spec, which is a hidden advantage — nothing we ship can secretly be too heavy | Real-time Lumen+Nanite+RT photorealism. Proven last night. |
| **~10 other PCs** | A genuine **offline farm**: Movie Render Queue path-traced cinematics (split frame ranges across machines), parallel lightmap bakes, asset cooking, texture processing. Days of render time compressed into hours | **One pooled real-time game.** Consumer machines cannot be ganged into a single live game instance — real-time distributed rendering across a LAN is not a thing for games. Ten PCs ≠ one big GPU. |
| **Higgsfield / Gemini** | Concept art, key art, trailer and story-beat cinematics via AI video, style exploration, texture/skybox source material, AI polish passes over engine renders | A playable world. Not one frame of gameplay. |
| **A better PC (purchase)** | Faster iteration; the ability to *author and preview* T3-quality visuals; future-proofing for a later high-end graphics mode or remaster | A change to what v1 players see. If the audience plays on 4060-class machines, the shipped game targets 4060-class machines. |

**One sentence to keep:** the game is capped by the player's GPU; the *images and films around the
game* are capped by nothing. We should max out both — separately, each in its own lane.

---

## 2. The V1 target look — **"Lamplight Realism"**

The recommended shipping look: **grounded, painterly-real, night-forward realism** — real human
proportions, real PBR materials, real light behavior — achieved with *baked* light and disciplined
scope instead of brute-force GPU features. It reads as modern, atmospheric, and real. It is not
cartoon, not retro, not low-poly, not PS1. It holds ~60 fps at 1080p on the RTX 4060 Laptop.

Night is our accomplice. Darkness hides LOD seams; fog legitimately shortens draw distance; lamp
pools tell us exactly where to spend the detail budget (inside the gold) and where to spend nothing
(inside the navy). The two-light doctrine was always a performance strategy wearing an art
direction costume.

### The technique stack (what "Lamplight Realism" means in UE5 settings)

- **Baked / mixed lighting, not Lumen.** GPU Lightmass bakes: static GI in lightmaps, volumetric
  lightmaps for characters moving through it. Baked bounce light is *physically computed* — it looks
  like path tracing because, for static light, it basically is. Two to four *stationary* lights per
  scene (the hero lamps, the brazier) for real dynamic shadows on characters; everything else static.
- **Mid-poly meshes with LODs, not Nanite.** Silhouette-true geometry (arches read as arches, brick
  courses modeled where lamplight rakes them), normal maps carrying the rest. Roughly
  10k–60k tris for hero props/characters — 2026-indie normal, nowhere near retro.
- **2K PBR materials** built on trim sheets and tiling sets (mudbrick, fired brick, glazed teal
  tile, timber, plaster) with vertex-painted wear. 8 GB VRAM is comfortable at 2K; 4K is where it
  chokes.
- **Screen-space reflections** for the glazed-tile sheen and wet courtyard stones; planar
  reflection only if a single hero shot demands it.
- **Exponential height fog + a few local fog volumes**, volumetric scattering on the handful of
  stationary lamps only — the god-rays through arches survive the pivot untouched.
- **Light functions** for the Kufic-pattern light pools (the Presence rig's Form B works *better*
  in realism — a light function through a mashrabiya is exactly how UE wants to do this).
- **DLSS Quality at 1080p–1440p output**, sharpened; SSAO; filmic tonemapping with our LUT.
- **Tight scene scope.** Courtyards, alleys, interiors, a bazaar arcade — connected intimate spaces
  with fog-dissolved ends. Never an open-world city. The vista of Baghdad is a matte-painting
  skybox card behind fog, which is also what a 1998 film would have done, and films look fine.
- **Strong art direction as the multiplier.** Pools of gold in oceans of navy is a *composition*
  rule; it costs zero milliseconds and is worth more than any GPU feature.

### Aura system + Presence rig, translated to realism
Everything in Rev 4 §2–3 carries over with the PS1 costume removed: T1's fresnel rim becomes a true
soft rim + one non-shadow-casting warm point light; T4's doubled shadow stays a *decal trick* (a
second offset shadow decal — cheap and unsettling at any fidelity); the lamp-dim trigger, the
falling soot, the fog skirt are all Niagara + parameter work. The Presence rig gets *stronger* in
realism: blown-out emissive over bloom, fog density overrides, rim-light re-aiming, and the LUT
lift were never retro techniques. Only "the wobble stills" dies with the wobble; its replacement
tell is **the fog recedes + the world's ambient wind/cloth motion calms to stillness** in the
presence radius.

### Reference touchstones (shipped games, modest hardware, "real but directed")
- **Hellblade: Senua's Sacrifice (2017)** — ~20-person team, ran on GTX 970-class GPUs, universally
  described as photoreal. Tight corridors, mastered lighting, small cast. This is the scope model.
- **A Plague Tale: Innocence (2019)** — mid-size team, modest min spec, period world, lamp-and-
  darkness art direction doing the heavy lifting. The closest existing cousin to our look.
- **The Forgotten City / The Invincible** — small UE teams, baked-lit, atmospheric, routinely
  called "gorgeous" by players who never once asked whether Nanite was on.
- **Assassin's Creed Mirage (2023)** — *art reference only*, not production scope: proof that
  lamplit Abbasid Baghdad at night reads as breathtaking with rasterized, mostly-baked techniques.

None of these were the most photoreal game of their year. All of them are remembered as beautiful.
That is the entire thesis.

---

## 3. The five-tier quality ladder

One scene, held constant across all five tiers so the comparison is honest:

> *A small lamplit courtyard in Abbasid Baghdad at night — weathered mudbrick walls, two horseshoe
> arches, a low iron brazier, a bearded scholar in robe and turban seated in warm lamp-gold light
> against moon-navy shadow, and in a far doorway a faint radiant light-presence: pure light, no
> figure, no face.*

Generate all five in Gemini, put them side by side, and the whole conversation becomes visual.

---

### T1 — V1 Real-Time (RTX 4060 laptop, ~60 fps) — **the recommended shipping target**

**The look:** A modern indie-realistic game frame. The scholar is unmistakably a real human — true
proportions, believable skin under lamplight, cloth with weight and correct folds — rendered with
clean PBR materials and baked global illumination that gives the mudbrick a soft, warm, *physically
correct* bounce. Geometry is honest but economical: arches curve smoothly, brick detail lives in
normal maps except where lamplight rakes it. Reflections on glazed tile are present but restrained.
The frame reads as "beautiful modern game," in the family of A Plague Tale or Hellblade — nothing
about it says budget; everything about it says *directed*. What it lacks versus the tiers above:
per-brick micro-geometry, light that visibly re-bounces in real time, and razor-perfect soft
shadows. At night, in fog, the eye rarely misses them.

**Gemini prompt (paste-ready):**

> Real-time video game screenshot, modern indie realism in the style of a well-directed Unreal
> Engine 5 game using baked global illumination (no ray tracing): a small courtyard in Abbasid
> Baghdad at night, circa 250 AH. Weathered mudbrick walls with clean 2K PBR texture detail, two
> horseshoe arches with smooth silhouettes and normal-mapped brick, packed-earth floor, a worn
> carpet, a low iron brazier breathing embers. An ordinary middle-aged scholar with a full
> grey-streaked beard, ochre wool robe and white turban sits near the brazier — realistic human
> proportions and a believable, visible face, his skin and hands warmed by amber oil-lamp light
> (~2200K, gold #D9A84E and #F0C46B) while cool moon-navy shadow (#0B1B3A, near-black #060B18)
> fills everything the lamps do not reach; one teal-painted wooden door (#2B7A78). Soft baked
> light bounce on the walls, restrained screen-space reflections on glazed tile, gentle volumetric
> fog swallowing the courtyard's far corner, thin smoke haze, drifting dust motes, stars as small
> points. In a far doorway across the courtyard, a faint radiant golden light-presence: pure warm
> light spilling onto the threshold stones — no figure, no silhouette, no face, no body of any
> kind. Grounded and atmospheric, real but economical, like Hellblade or A Plague Tale: Innocence;
> NOT cartoon, NOT stylized-painterly, NOT low-poly, NOT retro, no visible polygon edges. Ordinary
> people and a faceless light-presence only; never a prophet or imam face; no halos on real people.

---

### T2 — AI-Enhanced Cinematic (Higgsfield / AI post) — **for trailers and story films, not gameplay**

**The look:** T1's composition put through an unbounded-compute lens. Skin gains pores and
subsurface warmth; the wool robe gains individual fibers catching lamplight; brick gains a
photographic micro-roughness; the smoke behaves like filmed smoke. Cinematic anamorphic depth of
field, film grain, and grade. This is the most "wow" per dollar we own — and it is a *film frame*,
not a game frame. Nobody will ever walk through it. Its job: trailers, story-beat cinematics
between chapters, key art, and the store page.

**Gemini prompt (paste-ready):**

> Cinematic film still, photorealistic, shot on a 35mm anamorphic lens with shallow depth of field
> and fine film grain: a small courtyard in Abbasid Baghdad at night, circa 250 AH. Weathered
> mudbrick walls with photographic micro-detail, two horseshoe arches, packed-earth floor, a worn
> carpet, a low iron brazier breathing embers with realistic fire simulation. An ordinary
> middle-aged scholar with a full grey-streaked beard, ochre wool robe with visible individual
> fibers and a white turban, sits near the brazier — photoreal skin with pores and subsurface
> scattering, his face and hands warmed by amber oil-lamp light (~2200K, gold #D9A84E and #F0C46B)
> against deep moon-navy shadow (#0B1B3A, near-black #060B18); one teal-painted wooden door
> (#2B7A78). Volumetric smoke haze moving like filmed smoke, drifting dust motes in the lamp
> shafts, stars pin-sharp above. In a far doorway across the courtyard, a faint radiant golden
> light-presence: pure warm light spilling onto the threshold stones — no figure, no silhouette,
> no face, no body of any kind. Reverent, hushed, painterly-cinematic like a period film lit by
> Deakins; NOT a video game screenshot, NOT cartoon, NOT illustration. Ordinary people and a
> faceless light-presence only; never a prophet or imam face; no halos on real people.

---

### T3 — Real-Time on a High-End PC (Lumen + Nanite + RT) — **a future graphics mode, not v1**

**The look:** The full UE5 feature set, live. Every brick is real geometry down to the mortar
crumble (Nanite); the brazier's glow visibly re-bounces off the ochre wall and tints the scholar's
shadowed side (Lumen); shadows soften with distance exactly as physics demands (RT). The gap
between this and T1 is real but subtler than expected *at night in fog* — it is most visible in how
light bleeds around corners and how micro-detail catches rim light. This is what a 4080/5080-class
desktop buys. It is a settings toggle for a future edition, or the look of a remaster — it is not
what v1 players will have in their laps.

**Gemini prompt (paste-ready):**

> Ultra-high-end real-time Unreal Engine 5 screenshot with Lumen global illumination, Nanite
> micro-geometry, and hardware ray tracing, 4K: a small courtyard in Abbasid Baghdad at night,
> circa 250 AH. Weathered mudbrick walls where every brick, chip and mortar crumble is true
> geometry, two horseshoe arches, packed-earth floor, a worn carpet, a low iron brazier whose
> ember-glow visibly bounces onto the surrounding walls and re-lights the scene. An ordinary
> middle-aged scholar with a full grey-streaked beard, ochre wool robe and white turban sits near
> the brazier — high-fidelity real-time character with strand hair and detailed skin shading,
> warmed by amber oil-lamp light (~2200K, gold #D9A84E and #F0C46B) against deep moon-navy shadow
> (#0B1B3A, near-black #060B18); one teal-painted wooden door (#2B7A78). Ray-traced soft shadows
> that widen with distance, ray-traced reflections on glazed teal tile, dense volumetric fog and
> god-rays through the arches, drifting dust motes, stars overhead. In a far doorway across the
> courtyard, a faint radiant golden light-presence: pure warm light spilling onto the threshold
> stones — no figure, no silhouette, no face, no body of any kind. Next-generation real-time
> fidelity; NOT cartoon, NOT low-poly, NOT retro. Ordinary people and a faceless light-presence
> only; never a prophet or imam face; no halos on real people.

---

### T4 — Offline Path-Traced Render Farm (~10 PCs, Movie Render Queue) — **cinematic ceiling we own today**

**The look:** Physically accurate light transport with no time budget at all. Light behaves
perfectly: the brazier is a true area light with exquisitely soft falloff; every surface inherits
the exact color of every other surface; the smoke is lit from within; the scholar's skin has true
subsurface depth. This is animation-studio-grade imagery — and our ten machines can produce it
*now* by splitting frame ranges of Movie Render Queue path-traced sequences. Minutes per frame,
overnight per shot, video forever after. This is the natural fidelity for the Majlis Door scene and
The Oven cinematic: the most sacred beats get the most perfect light, pre-rendered, scholar-gated,
identical on every player's machine.

**Gemini prompt (paste-ready):**

> Offline path-traced 3D render, physically accurate global illumination, rendered with unlimited
> compute like a film studio frame (Arnold/RenderMan/UE5 path tracer quality): a small courtyard in
> Abbasid Baghdad at night, circa 250 AH. Weathered mudbrick walls receiving physically perfect
> bounced light, two horseshoe arches, packed-earth floor, a worn carpet, a low iron brazier acting
> as a true area light with exquisitely soft shadow falloff. An ordinary middle-aged scholar with a
> full grey-streaked beard, ochre wool robe with cloth simulation folds and a white turban sits
> near the brazier — skin with true subsurface scattering, warmed by amber oil-lamp light (~2200K,
> gold #D9A84E and #F0C46B) against deep moon-navy shadow (#0B1B3A, near-black #060B18); one
> teal-painted wooden door (#2B7A78). Volumetric smoke lit from within, dust motes suspended in
> converged light shafts, zero noise, perfect soft light everywhere, stars overhead. In a far
> doorway across the courtyard, a faint radiant golden light-presence: pure warm light spilling
> onto the threshold stones — no figure, no silhouette, no face, no body of any kind. Animation-
> film-quality lighting; NOT a game screenshot, NOT cartoon, NOT illustration. Ordinary people and
> a faceless light-presence only; never a prophet or imam face; no halos on real people.

---

### T5 — Pushed V1 Ceiling (RTX 4060 laptop, ~30 fps) — **the "high" preset of the same game**

**The look:** T1's world with the dials turned to what the 4060 can *just* hold at a locked 30:
richer volumetric fog with more scattering samples, two or three additional shadow-casting lamps so
more of the courtyard gets true dynamic shadow, higher-resolution shadows, contact shadows gluing
the scholar to the ground, higher LODs held longer, and — *in tight interiors only, subject to
testing* — software Lumen on Low with DLSS to get a whisper of live bounce. Visibly moodier and
more dimensional than T1; still clearly a sibling, not a different game. This is the honest maximum
of this hardware, and the proof that the gap between "what we ship" and "what we wish" is a
settings preset, not a broken dream.

**Gemini prompt (paste-ready):**

> Real-time Unreal Engine 5 screenshot at maximum settings achievable on a midrange laptop GPU at
> 30fps — high-quality rasterized rendering with rich volumetric lighting, multiple dynamic
> shadow-casting lights, contact shadows and a subtle touch of software real-time GI (no hardware
> ray tracing, no Nanite): a small courtyard in Abbasid Baghdad at night, circa 250 AH. Weathered
> mudbrick walls with detailed 2K PBR materials and faint live light bounce, two horseshoe arches,
> packed-earth floor, a worn carpet, a low iron brazier breathing embers and casting true dynamic
> shadows. An ordinary middle-aged scholar with a full grey-streaked beard, ochre wool robe and
> white turban sits near the brazier — realistic believable face and hands grounded by soft contact
> shadows, warmed by amber oil-lamp light (~2200K, gold #D9A84E and #F0C46B) against deep moon-navy
> shadow (#0B1B3A, near-black #060B18); one teal-painted wooden door (#2B7A78). Thick atmospheric
> volumetric fog with visible light shafts through the arches, smoke haze, drifting dust motes,
> stars as small points. In a far doorway across the courtyard, a faint radiant golden
> light-presence: pure warm light spilling onto the threshold stones — no figure, no silhouette, no
> face, no body of any kind. Moody, dimensional, the richest possible midrange real-time frame; NOT
> cartoon, NOT low-poly, NOT retro, NOT path-traced-perfect. Ordinary people and a faceless
> light-presence only; never a prophet or imam face; no halos on real people.

---

## 4. The roadmap — "highest quality first edition, more realistic later," honestly

**V1 ships as a braid of three tiers, each doing the job it is physically suited for:**

1. **Gameplay: T1 Lamplight Realism**, authored with a T5 "High" preset in the options menu from
   day one. Players on stronger machines get the pushed look for free; the 4060 laptop remains the
   honest floor. Target: 1080p / 60 fps (T1 preset), 30 fps (T5 preset).
2. **Cinematics: T4 path-traced films** rendered across the ten-PC farm for the sacred and pivotal
   beats (the Majlis Door, The Oven, chapter seals) — plus **T2 AI-enhanced** shots where speed
   matters (trailer, store page, social). Pre-rendered video plays identically on every machine;
   these are already "final quality" and never need remastering.
3. **Marketing: T2/T4 imagery exclusively.** The world sees the ceiling; the player's hands hold
   the floor; both are the same art direction, so nothing feels like a bait-and-switch — the
   palette, light doctrine, and Presence rules are identical at every tier.

**"More realistic later" means, concretely:**

- **Near (during v1 development):** a better dev PC accelerates iteration and lets us author the
  T5/T3 presets properly. Buy it for *speed*, not for the shipped look.
- **Mid (post-launch):** the T3 graphics mode — Lumen/Nanite/RT as an optional "Ultra" for desktop
  players — added when sales justify the QA cost. The content does not change; the light does.
- **Far (the remaster):** when min-spec hardware has moved two generations, the same world,
  faces, auras, and scholar-approved text re-lit at T3-as-default. Because the sacred rules are
  fidelity-independent, nothing precious has to be renegotiated — a remaster is a lighting pass,
  not a redesign.

This *is* the "highest quality first edition": the highest quality that can actually reach a
player's screen at 60 fps, wrapped in cinematics at the highest quality computable at all.

---

## 5. A short word to the owner

The mistake is not wanting realism — it is measuring a real-time frame against images that had a
thousand times its compute budget and none of its obligations. A Gemini image gets thirty seconds
per picture and never has to show the same wall from a second angle; your game gets sixteen
milliseconds and has to be *true* from everywhere, forever, on a laptop. Chasing the AI image with
the game engine is a race no studio on earth wins, which is why the most beloved beautiful games —
Hellblade, A Plague Tale — won a different race: they chose a look their hardware could hold
*perfectly* and directed it without compromise. Steadiness, not maximum brightness — the same
lesson the aura system teaches. Ship the lamp that burns steady on the player's machine, surround
it with path-traced films from your farm and AI key art that show the dream at full radiance, and
let the remaster be the dream made walkable when the hardware arrives. Nothing about this path is
settling; it is the exact path every beautiful game you have ever admired actually took.
