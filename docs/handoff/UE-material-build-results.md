# UE5 نūر + PS1 material build — results
_Built by Claude (Opus 4.8) via MCP, 2026-07-12. Source: ultracode workflow `ue-ps1-nur-material-design` (8 agents; winner = Proposal B, balanced)._

## What got built + VERIFIED via MCP (zero GUI)

Both materials authored end-to-end through `MaterialTools` + `ObjectTools` — create asset → add expression nodes → set node props → wire pins → set material domain → compile → apply → capture-verify.

### `M_Nur_Body` — faceless نūر emissive (DONE, visually confirmed)
- Domain `MD_Surface`, ShadingModel `MSM_Unlit`, Blend `BLEND_Opaque`.
- Graph: `CoreColor` (#D9A84E) / `RimColor` (#F0C46B) VectorParams → `LinearInterpolate` (Alpha = `Fresnel` exp 3.5) → `Multiply` by `BaseGlow` scalar (6.0, HDR>1 for bloom) → `MP_EmissiveColor`.
- Assigned to the `Nur_Body` sphere actor via `OverrideMaterials` on its `StaticMeshComponent0`.
- **Verified:** viewport capture shows a self-lit gold sphere, brighter at the grazing rim, **no face / no features** — reverent by construction (emissive-only material, no BaseColor/Normal/texture channel that could render a face).

### `M_PP_PSX` — PS1 posterize post-process (DONE, applied, frame-affecting)
- **GATE PASSED:** `MaterialDomain = MD_PostProcess` set + read-back confirmed via `ObjectTools` — post-process materials are fully agent-authorable, no Ali GUI for the domain.
- Graph (v1, compile-safe): `SceneTexture` (PostProcessInput0) → `Multiply` by `ColorLevels` (16) → `Floor` → `Divide` by `ColorLevels` → `MP_EmissiveColor` (color-depth quantization / banding).
- Applied via a spawned **unbound `PostProcessVolume`** (`bUnbound=true`, `Settings.WeightedBlendables.Array=[{Weight:1, Object:M_PP_PSX}]`) — set through `ObjectTools.set_properties` (nested struct JSON works).
- **Verified:** capture shows the volume modifying scene color (edge tonal shift). Banding is subtle at full-res with TAA on — see refinements.

## New MCP capabilities proven this session
- **Material graph authoring is fully agent-driven** — `create_material` / `create_function` / `create_parameter_collection`, `add_expression` (class refPath), `connect_expressions`, `connect_to_output`, `recompile`, `list_expression_classes`, `get_expression_input_names`/`get_expression_output_names`.
- **Node/asset property writes via `ObjectTools.set_properties`** (values = JSON *string*): parameter names, LinearColor defaults, scalar defaults, Fresnel exponent, material domain enum, SceneTextureId enum, and **nested struct arrays** (PostProcessVolume blendables). `get_properties` reads back. This is the companion to the Blueprint DSL — together they cover logic + look.
- **Assigning a material to a placed actor** = `set_properties` `OverrideMaterials` on the mesh component (`...StaticMeshActor_N.StaticMeshComponent0`).

## Remaining refinements (not blockers — the look is functional)
1. **Chunky-pixel low-res** (the biggest PS1 tell) = cvars in `SHIA/Config/DefaultEngine.ini` `[SystemSettings]` — no MCP cvar-set tool, so Ali (or a file edit with editor closed):
   ```
   r.ScreenPercentage=50
   r.AntiAliasingMethod=0
   r.TemporalAA.Enable=0
   r.PostProcessAAQuality=0
   r.Lumen.DiffuseIndirect.Allow=0
   r.ViewDistanceScale=0.5
   ```
2. **نūر bloom glow** — on the `PP_PSX_Volume`: Bloom Intensity ≈ 0.6, Threshold ≈ 1.0 (the HDR emissive already exceeds 1 → will bloom). Set via `ObjectTools.set_properties` on the volume's `Settings` (agent-doable) or GUI.
3. **Richer PS1 crunch** — swap the posterize for the design's `Custom` HLSL node (8×8 Bayer dither + mosaic + hard navy distance-fog + vignette). Higher compile risk; add incrementally and `recompile` to catch errors.
4. **نūر pulse (breathing/voice-reactive brightness)** — needs a `MaterialInstanceDynamic` created on the NPC + `SetScalarParameterValue` on Tick (a Blueprint step; `BP_NurNPC` already exists to host it). Brightness encodes humility/status; color never varies.
5. **Vertex snap / affine warp** — the `MF_PS1_Vertex` WorldPositionOffset function (Custom node) from the full spec, for jittery PS1 geometry.

## Guardrail
- نūر body is a plain glowing sphere — **faceless, no features, no sacred figure depicted**. Material has no channel able to render a face.
- No audio/art constraints touched.

## Persistence — ALI ACTION
- Materials `/Game/Nur/M_Nur_Body` + `/Game/Nur/M_PP_PSX` are **saved to disk**.
- The **level is still `/Temp/Untitled_1` (unsaved)** — Ctrl+S → save as `/Game/Maps/Courtyard_Test` to persist the courtyard, NurNPC, sphere body (now gold), and PP_PSX_Volume. Lost on editor close otherwise.

## Full winning spec
The complete design spec (all 3 scored proposals, the richer Custom-node crunch shader, MPC, vertex-snap function, exact params) is in the workflow output. Key scores: A(minimal)=34, B(balanced)=33 winner-by-risk, C(rich)=30.
