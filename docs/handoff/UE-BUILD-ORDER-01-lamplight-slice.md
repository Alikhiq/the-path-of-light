# BUILD ORDER 01 — Lamplight Courtyard (greybox vertical slice)

*First real build in the new look. For the ONE agent driving the SHIA editor over MCP (:8000). Follow `docs/lamplight-realism-4060-build-spec.md` for all numbers; this is the sequenced "do it in this order" checklist. Greybox first — engine primitives, no imported art — so the whole loop is proven before Ali imports real meshes.*

**Status when this was written (2026-07-13):** SHIA editor launched, MCP server confirmed live on `127.0.0.1:8000`. Scholar-review request = SENT (owner). Prereqs still owner-side: Support Hardware Ray Tracing ON (needed for GI *baking* later, not for this greybox step) + remove legacy `M_PP_PSX` PostProcessVolume. This greybox slice does NOT bake yet, so it can proceed now.

---

## Goal of this slice
A walkable night courtyard, lamp-pool lighting, heavy fog, one voiced human NPC standing on a dais with an aura rim — proven in PIE. No baking, no imported assets. When this reads right, it becomes the shell the real Lamplight art drops into.

## Build order (MCP)

1. **Level** — use the current `Template_Default` map (already the startup map). Do NOT create a new one (no save-level tool over MCP; Ali saves with Ctrl+S at the end).

2. **Greybox geometry** (StaticMeshActors, engine primitives `/Engine/BasicShapes/*`):
   - Ground: `Plane` scaled ~30×30.
   - Courtyard walls: 4 `Cube`s, thin + tall, forming an open square (~20m interior).
   - Colonnade: 6–8 `Cylinder`s as columns along two sides.
   - Dais: one wide low `Cube` at the far end (where the NPC stands).
   - PlayerStart facing the dais.

3. **Lighting scaffold** (the Lamplight signature — all values per spec §Lighting):
   - **Directional light = the moon: STATIONARY** (Static, per spec — zero god-ray shafts), low intensity, cool blue-white.
   - **Skylight** low, cool, captures the fog.
   - **Lamp pools:** 4–6 **Point lights**, warm gold (`#F0C46B` ≈ 2700–3200K), small radius, low-mid intensity, placed at columns/dais edges. These are the pools the player walks between.
   - **Exponential Height Fog** + **Volumetric Fog ON**, `GridPixelSize=16`, `GridSizeZ=64` (spec: the #1 sub-30fps risk — do NOT use 8/128 here; that's cinematic-only).

4. **Post-process volume** (unbound = whole level) — the **Lamplight grade**:
   - Filmic tonemapper, slight teal in shadows / warm in highlights, low bloom, SSR ON, exposure locked (no auto-eye-adaptation swimming), vignette subtle.
   - **NO PSX post** — if any `M_PP_PSX` volume exists in the level, delete it. Mutually exclusive with this grade + TSR.

5. **The NPC** (reuse the proven `BP_NurNPC` pattern, now for a HUMAN figure):
   - Body: a `Cylinder`/capsule greybox on the dais (real mesh imported later by Ali).
   - **Aura rim:** apply the `M_Nur` emissive as a rim/fresnel material → tier "steady flame" (righteous), warm gold `#F0C46B`. This is a *local* glow with the figure keeping its shadow — the ordinary-righteous look, NOT the Maʿṣūm rig.
   - **Proximity trigger → voice line:** reuse the existing Blueprint graph (`write_graph_dsl`) — sphere overlap fires a dialogue/audio cue when the player approaches. Placeholder line for now.

6. **Verify in PIE:** walk from PlayerStart across the lamp pools to the dais; fog reads; aura glows; proximity line fires. Note framerate (`stat fps`) — target ≥30 at 720p→1080p TSR.

7. **Hand back to Ali:** report what's placed; Ali does **Ctrl+S** to save the level and imports real meshes/textures/audio when ready (the one MCP wall).

## Guardrail check before finishing
- The NPC here is an **ordinary righteous human** → face + shadow + local aura = correct.
- Any Maʿṣūm/Allah/angel presence would be **light only** (scene-wide radiance, NO body, NO face, Cast Shadow OFF, camera kept back) — none in this slice.
- No real historical narrator is graded by aura — this greybox NPC is fictional/placeholder.

## Do NOT do in this slice
No GI bake (needs owner's RT-ON toggle first), no imported binaries, no Nanite/Lumen/ray-tracing at runtime, no new level file. Prove the shell; art comes after.
