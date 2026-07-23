# Art Bible Update — Faces & Auras (Revision 4)
_"The Path of Light" / Bayt al-Nūr · UE 5.8 · Art direction by Fable 5._

> **RENDER-LAYER AMENDMENT (Rev 5, 2026-07-12):** the PS1-retro render costume in this doc is **RETIRED** (this overrides the "render doctrine … stands unchanged" note just below). The **faces + aura tiers + Maʿṣūm Presence design all stand** — only the render techniques change to **"Lamplight Realism"** (grounded real-time realism on the RTX 4060: baked GI, mid-poly, 2K PBR; no PS1 / Nanite / Lumen / runtime-RT). Translations: the §2.4 LUT/Bayer-dither rim → a **true soft fresnel rim + one subtle point light**; blob-decal shadows **stay** (cheap in realism too); the §3 "the wobble stills" holiness cue is **replaced** by *fog receding + ambient motion calming to stillness* (there is no wobble to still). Authoritative render spec: [`render-tiers-and-v1-target.md`](render-tiers-and-v1-target.md) + [`lamplight-realism-4060-build-spec.md`](lamplight-realism-4060-build-spec.md)._

**Supersedes** the "نŪR LIGHT-BEING LOOK" section of `docs/ue5-concept-prompts.md` (line 16) and the
"no human faces" clause of its NEGATIVE line. Everything else in that bible — render doctrine, camera,
two-light lighting, palette, world, atmosphere, mood — **stands unchanged**.

## 0. The pivot, in one line
Ordinary people now have real, visible faces and bodies. Spiritual/moral state reads through an
**aura system**. The 14 Maʿṣūmīn, Allah, and the angels remain **light only — never a face, never a body**.
That last rule is load-bearing and non-negotiable; every technique below is designed inside it.

---

## 1. The human character look (PS1-Baghdad)

### 1.1 Budgets
| Class | Tris | Texture | Skeleton | Notes |
|---|---|---|---|---|
| Crowd citizen | ~900 | one 128×128 | 16 bones, mitt hands | 4 base bodies × palette-swap dye slots |
| Named / teaching NPC | 1,400–1,800 | one 256×256 | 20 bones, mitt hands | unique head + costume |
| Head (within above) | 250–350 | 64×64 region of sheet | no facial bones | nose is **geometry** (faceted wedge), not texture |

No normal maps, no roughness maps. One albedo per character, palettized feel, Bayer 4×4 dither baked
into shading ramps. Affine mapping and vertex snap stay on — with one exception below.

### 1.2 Faces that read at 128–256px
A PS1 face is three or four value shapes, not a portrait:
- **Eyes:** 2×3-texel dark blocks under a single 1-texel brow stroke. Optional 1-texel catchlight on named NPCs only.
- **Mouth:** painted, static; 2-frame open/closed swap for dialogue at most. No lip sync.
- **Identity triangle** — every character is distinguishable at 20 m by exactly three attributes:
  1. **Beard geometry** (shape + color: full grey-streaked, short black, hennaed, none),
  2. **Headgear silhouette** (see 1.3),
  3. **One accent dye slot** (a single palette color on sash, turban band, or trim).
- **Skin ramp:** 4 warm ochre-shifted tones, #C89A6B → #5C3E2A, so lamp gold reads on skin and moon-navy cools it correctly under the two-light doctrine.
- **The one wobble exemption:** heads snap on a 2× finer vertex grid and run jitter at **0.25× amplitude**.
  Bodies and the world keep full PS1 wobble; faces stay legible. (This also sets up the Maʿṣūm tell in §3 —
  the player's eye is already trained that "steadiness = importance.")

### 1.3 Costume — Abbasid dress as silhouette language
Identity must read from hat + hem + sleeve alone, in fog, at night:
- **Base:** qamīṣ (shirt) + sirwāl (trousers), khuff boots.
- **Scholars / narrators:** jubba over-robe + **ṭaylasān** (shawl draped over turban and shoulders) — the drape is the scholar silhouette.
- **Court / judges:** **qalansuwa** (tall cap) under the turban, robes in Abbasid official **black** — historically correct and it plays into the shadow language.
- **Merchants / craftsmen:** rolled sleeves, apron or sash, shorter hem, ʿimāma tied practically.
- **Women:** long thawb + khimār wrap; silhouette carried by wrap volume and hem.
- **Saturation rule:** all garments sit at 60–70% of palette saturation (mudbrick #7A5C3E, dusty navy,
  undyed linen). **Auras own the chroma.** The only fully saturated cloth in the game belongs to one
  character — see Jaʿwan, §4b — and that is deliberate.

Dialogue UI: faced NPCs get a 32×32 painted portrait chip. Maʿṣūmīn never get a portrait chip (§3.4).

---

## 2. The aura system — "the lamp rig"

Auras are lamp-states, not halos. Diegetic rule: **no NPC ever mentions seeing an aura.** It is film
language for the player, not an in-world power — the player is never implied to have unveiling (kashf).

### 2.1 The guardrail (before the tiers)
- Aura tiers T1/T3/T4 attach to **fictional teaching NPCs and abstract objects only** (a forged scroll may
  smoke; a sound chain's casebook icon may glow).
- **Every real historical person renders Tier 2 (CLEAR), always, no exceptions.** Narrator reliability is
  taught in the casebook/rijal ledger as text ("its reliability is not established"), never on a body.
  The game must never let a player read a real narrator as damned or blessed.
- Crowd NPCs are always CLEAR. Auras appear on story NPCs only — keeps them salient and cheap.

### 2.2 Tiers
| Tier | Name | Color | Intensity | VFX cues | Shadow | Signals |
|---|---|---|---|---|---|---|
| T0 | **AN-NŪR** (reserved) | core #F0C46B blown to white | scene-altering | not an aura — the Presence rig, §3 | **none** | a Maʿṣūm. Never assigned to a character mesh with a face. |
| T1 | **STEADY FLAME** (ṣāliḥ) | rim #F0C46B, pool #D9A84E | modest, constant | warm fresnel rim; small warm point light r≈1.5 m pooling on ground/walls like a carried lamp; 3–5 ember motes rising slowly | normal soft blob | honesty, precision, generosity — the person behaves like a lamp: local, warm, steady |
| T2 | **CLEAR NIGHT** (default) | faint moon rim #2B7A78 @ 10–15% | none (standard rig) | nothing emissive; lit purely by the two-light doctrine | normal blob | no verdict. Ordinary, unknown, or real-historical. The majority — this is what keeps auras meaningful |
| T3 | **GUTTERING** (muḍṭarib) | rim #3E4F5A (teal drained to slate) | low, flickering 0.5–2 Hz noise | lamp-light response on their material scaled 0.5 — they read cold even beside a lamp; 1–2 motes that **fall** instead of rise; fog clings slightly | blob slightly elongated | confusion, weak memory, embellishment habit. **Not damnation** — maps to ḍabt lessons ("honest but imprecise") |
| T4 | **HOLLOW LAMP** (zāʾif — counterfeit) | body multiplied toward #060B18, thin cold edge #1E3A8A | inverted — absorbs | nearby oil lamps dim 20% within 2 m (scripted, 0.5 s ease); **doubled blob shadow, second blob offset**; soot motes drifting down; a 1 m fog skirt thickens at the feet | doubled / misaligned | active deceit, fabrication. The counterfeit coin: bright surface, hollow weight |

### 2.3 Readability at PS1 fidelity
Never hue alone — each tier differs on **three redundant channels**: color, motion (rising embers /
flicker / falling soot), and shadow behavior. Colorblind-safe by construction.

### 2.4 UE 5.8 implementation (PS1 budget)
- **Rim:** fresnel through a 16-step LUT with baked Bayer dither — reads as chunky PS1 banding, not smooth bloom.
- **Glow:** one camera-facing 64px additive dithered sprite per aura'd NPC.
- **Particles:** Niagara, hard cap 8 per NPC, texel-sized quads.
- **Lights:** T1 gets one non-shadow-casting point light; that is the only per-NPC light in the game.
- **Shadows:** all characters use PS1-authentic **blob decals**, which makes T3 elongation and T4 doubling
  a two-parameter trick instead of a rendering feature.
- **T4 lamp-dim:** trigger volume driving nearby lamp intensities; restores on exit.

---

## 3. The Maʿṣūm treatment — "the Presence rig"

**Never:** a face, skin, hair, eyes, a head mesh, a walk cycle, lip sync, a portrait chip, a nameplate,
a shadow, an inventory interaction, or a saying invented for them (per `scholar-review.md` check #5).

### 3.1 Approved forms (choose per scene)
- **Form A — Veiled radiance.** A robed low-poly silhouette (≤600 tris) with **no head geometry**; above
  the collar is an emissive card. Emissive at 8–16× scene white so bloom erases all interior detail —
  the silhouette is made of light, not lit. Slow 0.5%-amplitude breathing scale. **Distance rule:** never
  nearer than 6 m to camera; if the player approaches, the presence brightens until it dissolves the frame —
  proximity yields light, never detail.
- **Form B — Off-frame source.** The presence never enters frame. A volumetric shaft enters through an
  arch or mashrabiya; a light-function projects a Kufic-pattern pool on the floor. The world is the portrait.
- **Form C — Threshold glow.** Gold light spilling from a doorway or majlis lattice; dialogue delivered as
  gold text under a calligraphic medallion. The player never crosses the threshold.
- **Hands-only:** NOT approved by default. Ships excluded; goes to the scholar panel as an open question (§5).

### 3.2 The world reacts — how the player knows
The tell is never on the figure; it is that **the world behaves differently**. Within a ~10 m presence radius:
1. **The wobble stills.** Vertex jitter amplitude lerps toward 0. The PS1 world itself steadies. (Our most
   engine-native holiness cue; the parameter already exists in the PSX shader.)
2. **The fog recedes.** Local volumetric density override, −40%, soft falloff.
3. **Auras lean.** Every particle velocity field biases toward the presence — T1 embers drift to it,
   and even T4 soot bends. Light recognizes light.
4. **The grade lifts.** LUT crossfade: navy rises toward #1E3A8A, golds saturate toward #F0C46B.
5. **Everyone is lit by it.** Rim-light direction on all characters re-aims to the presence as the
   dominant source — it becomes the scene's sun.
6. **The camera lowers its gaze.** Player pitch eases down 4°, FOV narrows 2–3°, input lightly damped.

### 3.3 Distinctness ladder — righteous person vs. Maʿṣūm (never confusable)
| Cue | T1 Steady Flame | T0 Presence |
|---|---|---|
| Face | visible, painted | none, ever |
| Light | local 1.5 m lamp-pool | re-lights the whole scene |
| Shadow | casts a blob | casts none (sources don't cast shadows) |
| Wobble | unaffected | stills the world |
| Scale of effect | on the person | on the world |

### 3.4 Presentation rules
No VO — text only, gold type, calligraphic medallion in place of a portrait, honorific rendered
(ﷺ / عليه السلام), one low sustained chord as audio. All of this is scholar-gated (§5).

---

## 4. Example characters

**a) Abū Sahl al-Warrāq — fictional trustworthy copyist (T1 Steady Flame).**
1,600 tris, 256px sheet. Identity triangle: full grey-streaked beard / white ʿimāma with ṭaylasān drape /
ochre accent band. Ink-stained fingertips painted on the texture; reed pen behind the ear. His warm pool
merges seamlessly with the shop's lamp pools — he belongs to the light. Teaching beat: he checks his own
margin notes before answering, and when he says **"I do not remember,"** his flame holds perfectly steady —
the aura rewards honest uncertainty, not omniscience. That is ḍabt made visible.

**b) Jaʿwan the Qaṣṣāṣ — fictional market storyteller and fabricator (T4 Hollow Lamp).**
1,400 tris. Deliberately the most attractive design in the market: groomed short black beard, the game's
only fully saturated garment — a teal #2B7A78 jubba — silver-ringed fingers. Corruption is charismatic;
the palette says so. As he leans in, the stall lamps dim 20%; his second shadow-blob slides out of
alignment on the exact dialogue beats where he lies; soot drifts down around his hem. His stories are
beautiful and chronologically impossible — the matn lesson (D3.3): beauty and endorsement are not evidence.

**c) The Majlis Door — an Imam-presence scene (Forms B + C).**
Pre-dawn, a house in Karkh. The player arrives carrying a verified chain. Gold light spills through the
mashrabiya lattice, projecting a Kufic pattern across the courtyard floor. The fog draws back; the
vertex wobble stills; the embers of the player's casebook lamps flare and lean toward the door. Dialogue
is gold text under the medallion, honorific rendered; the address is fictional-devotional and attributes
no saying. The camera eases down four degrees. The player never crosses the threshold. When the scene
ends, the beam fades and a single oil lamp remains burning on the step — the player's lamp to carry on.

---

## 5. Reverence, shippability, and the scholar gate

This revision stays reverent because the hard line never moved — the Maʿṣūmīn gained no pixels of face
or body in this pivot; ordinary people did — and it stays shippable because every effect above is
PS1-cheap (one sprite, one LUT rim, blob decals, ≤8 particles, one optional point light) and every
sacred treatment is *subtractive* (blown-out emissive, off-frame light, stilled parameters) rather than
new content that could drift. **Before public launch, the following go to the qualified Twelver scholar
panel (two independent reviewers, per `scholar-review.md` §G):** (1) this document plus storyboards of
*every* presence scene and every line of text displayed near a presence, confirming none constitutes
attributing a saying; (2) the hands-only question — default answer is no, it ships excluded; (3) the aura
system's framing — tier names and Arabic glosses, confirmation that no real historical person ever
carries any tier but CLEAR, that "guttering/hollow" cannot be read as verdicts of damnation on persons,
and that a player-visible moral aura raises no kashf/ghuluww concern in this fictional framing; (4) which
real historical figures, if any, may be depicted with faces at all — recommendation: **none**; every
faced character in the game is fictional, and real narrators exist only as text in the casebook;
(5) honorific rendering (ﷺ, عليه السلام) inside a pausable, screenshottable game UI; (6) audio policy —
no voice acting for any Maʿṣūm (text only) and the instrumentation of the presence chord and any music,
per marjaʿ guidance. `docs/scholar-review.md` gains a new section covering items 1–6 before the packet
goes out; `docs/ue5-concept-prompts.md` NEGATIVE line is amended from "no human faces" to "no faces on
sacred figures; ordinary-human faces per Revision 4."
