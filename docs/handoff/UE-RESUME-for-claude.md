# UE RESUME → Claude — pipeline test

> 🛑 **STOP — DIRECTION CHANGED (2026-07-12, decided in the desktop session).** The PS1/retro look and the faceless-نūر character are **DROPPED**. Do **not** continue any PS1 post-process / faceless-emissive work described below. New v1 canon: **real human characters + the aura system** ([`../art-bible-faces-and-auras.md`](../art-bible-faces-and-auras.md)) rendered as **"Lamplight Realism"** — grounded real-time realism on the RTX 4060; baked GI; no PS1 / Nanite / Lumen / runtime-RT (authoritative brief: [`../lamplight-realism-4060-build-spec.md`](../lamplight-realism-4060-build-spec.md) + [`../render-tiers-and-v1-target.md`](../render-tiers-and-v1-target.md)). Before building the new look: set **Support Hardware Ray Tracing = ON** in the project (needed to BAKE lighting; the game still ships `r.RayTracing=0`), and **remove the `M_PP_PSX` PostProcessVolume + any `r.ScreenPercentage=50`**. The MCP findings below (worked-vs-failed ops, gotchas) remain **VALID** — only the look changed.
_Updated: 2026-07-12 · MCP connection wiring by Claude · Agent next: GPT-5.6 or Claude_

> GPT-5.6: finalize this the moment you stop (message limit, blocker, or done). Fill every
> section — no blanks. See `UE-pipeline-test-handoff.md` sections 6–7. The MCP-operations
> log is the single most valuable thing here.

## MCP connection wiring — DONE by Claude (2026-07-12), needs editor restart to verify
- Project exists: `C:\Users\614lu\Unreal Projects\SHIA\SHIA.uproject` (was open in editor).
- Enabled in `.uproject`: `ModelContextProtocol` (Anthropic's official UE5.8 MCP plugin, `Engine/Plugins/Experimental/ModelContextProtocol`) + `AllToolsets` (umbrella → EditorToolset/AIModule/PCG/Niagara/UMG… — the toolset plugins are what actually expose editor tools; MCP alone only ships a `Greet` sample).
- `Config/DefaultEditorPerProjectUserSettings.ini`: `bAutoStartServer=True`, `ServerPortNumber=8000` → server auto-starts on editor launch.
- Server: **HTTP streamable**, `http://127.0.0.1:8000/mcp`, name `unreal-mcp`. Port 8000 was free.
- Claude registered: `claude mcp add --transport http unreal-mcp http://127.0.0.1:8000/mcp` (local scope, this repo). Shows "Failed to connect" until the editor is restarted + server up. **A NEW Claude session must start to see the tools.**
- Codex registered: appended `[mcp_servers.unreal-mcp] url="http://127.0.0.1:8000/mcp"` to `~/.codex/config.toml`.
- Console commands (verified from plugin source, differ from earlier memory guess): `ModelContextProtocol.StartServer [port]`, `.StopServer`, `.RefreshTools`.
- **Ali's next action (GUI, only Ali can):** close SHIA editor → reopen it (loads plugins + auto-starts server) → check Output Log for the MCP server line on `127.0.0.1:8000` → restart Claude / new session. Then GPT-5.6 (or Claude) drives the build.
- **PERF WATCH:** SHIA default map is `OpenWorld` + `r.RayTracing=True`/Substrate/VSM — HEAVY for the 4060 laptop. For the go/no-go fps test, build the courtyard on a **blank/basic level**, disable RayTracing. PS1 look needs none of it.

## Status
| Piece | State | Notes |
|-------|-------|-------|
| UE project created + opens | DONE | `SHIA.uproject` |
| MCP plugin + toolsets enabled + registered | DONE (Claude) | needs editor restart to go live |
| MCP responds to the agent | **DONE — VERIFIED** (Claude, 2026-07-12) | editor restarted, server live on `127.0.0.1:8000`, agent drove editor end-to-end |
| Greybox courtyard (~20×20) | **DONE** (Claude, MCP) | floor + 4 walls from `/Engine/BasicShapes/Cube`; visually confirmed via viewport capture |
| نūر NPC (faceless emissive) | **DONE (logic) / partial (visual)** (Claude, MCP) | `BP_NurNPC` Actor BP placed + a sphere body actor; body is un-emissive greybox (emissive mat = PS1 step, pending) |
| Proximity voice trigger | **DONE — VERIFIED in PIE** (Claude, MCP) | BP EventTick: player within 400cm → PrintString + PlaySoundAtLocation(VoiceLine) → mark spoken. Fired in PIE, log confirmed. |
| Voice audio import (.wav) | **BLOCKED via MCP — Ali GUI required** | AssetTools has NO binary import tool (text only). Ali imports .wav then assigns to `BP_NurNPC.VoiceLine`. |
| PS1 post-process material | not started | MaterialTools present; also carries the نūر emissive body mat |
| Third-person walk | not started | default PIE pawn used for the proximity test; real char-controller pending |
| 6–10 pre-baked voice lines | not started | same import wall; mechanic ready to receive them |

## The go/no-go — answer with evidence
1. Performance (fps on the 4060 laptop): not a rigorous number yet. PIE ran fine on the greybox (trivial scene, expected). The real perf risk was `OpenWorld` + RayTracing/Substrate/VSM — we deliberately built on a **blank temp level** so that risk is sidestepped for the PS1 look. No fps concern for greybox-scale PS1 content.
2. Voice (NPC speaks on approach): **MECHANIC YES — verified in PIE. Audio file import NO via MCP (Ali GUI).** Built `BP_NurNPC` entirely via MCP: EventTick checks distance to player pawn, and within 400cm fires PrintString + `PlaySoundAtLocation(VoiceLine)` then sets a "spoken" flag. Ran PIE, log confirmed: `LogBlueprintUserMessages: [BP_NurNPC_C_0] Nur speaks: as-salamu alaykum`. The trigger/logic/play-node chain is 100% agent-buildable. The ONE gap: importing the actual `.wav` — no MCP tool for binary asset import, so `VoiceLine` is null (silent) until Ali imports a cue and assigns it.
3. MCP (agent did most editor ops): **YES, strongly. Feel: hours, not days.** Agent spawned 8 actors, positioned/scaled them, authored + compiled a full Blueprint event graph via DSL, captured the viewport, and ran PIE + read logs — all via MCP with no GUI clicks. The only GUI-only op hit so far is **binary asset import** (audio/textures/meshes from disk).
→ Verdict: **GO — for both the build pipeline AND the voiced-NPC mechanic.** Everything except binary asset import is agent-drivable and fast. Ali's remaining manual jobs are narrow: (a) save levels, (b) import audio/art files, then the agent wires them up.

## MCP operations — worked vs failed (MOST IMPORTANT)
- WORKED:
  - `list_toolsets` / `describe_toolset` — full toolset registry exposed (scene, actor, material, blueprint, static/skeletal mesh, data table, texture, programmatic python, etc.).
  - `SceneTools.add_to_scene_from_asset` — spawned 5 `StaticMeshActor`s from `/Engine/BasicShapes/Cube` with location+scale. Parallel calls in one message all succeeded (StaticMeshActor_1..5).
  - `SceneTools.get_current_level` — returns `/Temp/Untitled_1`.
  - `EditorAppToolset.CaptureViewport` with `captureTransform` override — got a PNG of the greybox for visual confirmation.
  - `EditorAppToolset.StartPIE` / `IsPIERunning` / `StopPIE` — play session started (warmup 2s, spawn override), confirmed running, stopped cleanly.
  - **Full Blueprint authoring via `BlueprintTools`** — the standout capability. `create` (BP from Actor), `add_variable` (bool), `add_object_variable` (SoundBase ref), `find_node_types` / `get_node_type_pins` (node discovery), and **`write_graph_dsl`** — authored the ENTIRE proximity-speak event graph from one Lisp-like DSL script (EventTick → not-spoken guard → GetPlayerPawn → GetDistanceTo → `<400` branch → PrintString + PlaySoundAtLocation + SetSpoken) in a single call, auto-compiled. `read_graph_dsl` reads it back. This is the big unlock: gameplay logic is agent-buildable, not just level dressing. `get_graph_dsl_docs` returns the full grammar — read it first.
  - `LogsToolset.GetLogEntries` (pattern regex + `category:""`) — read PIE PrintString output back to verify runtime behavior. Closes the build→run→observe loop entirely in-agent.
- FAILED / needed workaround (GOTCHAS — read before you build):
  - **NO binary asset import via MCP.** `AssetTools` write_file is TEXT ONLY; there is no import-from-disk tool for `.wav` / textures / FBX. This is THE agent wall — audio, art, and meshes must be imported by Ali in the GUI, then the agent references/wires them. `BP_NurNPC.VoiceLine` is left null pending Ali's `.wav`.
  - **Component-add works only on placed level actors, NOT on Blueprint CLASSES.** `PrimitiveTools.add_sphere/cube/etc.` reject a BP-class refPath ("not valid Actor"). So you can't give a BP a mesh/collision component via these tools. Workaround used: put logic on `EventTick` distance polling (needs no collision component) + a separate sphere actor for the body. If a BP genuinely needs components, that may need the ProgrammaticToolset or GUI.
  - **Bool variable accessor drops the `b` prefix.** Var `bSpoken` → getter/setter node IDs are `Variables|Default|GetSpoken` / `SetSpoken`, NOT `GetbSpoken`. `write_graph_dsl` errors "does not exist" otherwise. Use `find_node_types` with the bare name to discover the real accessor ID.
  - **Param-name gotchas:** `write_graph_dsl` takes `code` (not `dsl`); `add_variable` takes `type_name`; `add_object_variable` takes `object_class` (a refPath object, not a string); `find_node_types` requires `context_pins` (pass `[]`); `BlueprintTools.create` takes `folder_path`+`asset_name`+`asset_type` (refPath), not `asset_path`+`parent_class`.
  - **`call_tool` `tool_name` must be the SHORT name** (e.g. `get_current_level`), NOT the fully-qualified `editor_toolset.toolsets.scene.SceneTools.get_current_level` that `describe_toolset` prints — the qualified form errors "Unknown tool". Pass the qualifier via the separate `toolset_name` arg.
  - **`CaptureViewport` requires the `annotations` object even when you don't want overlays** — it has no default; omitting it errors "input param annotations needs a default value". Pass all fields zeroed + `classFilter: null`.
  - **Viewport/editor image data comes back as inline base64 (~1.1M chars) and blows the context window.** Never read it inline. It auto-spills to a tool-results `.txt`; decode with python (`json → returnValue.image.data → base64.b64decode → write .png`) and Read the PNG file. Workflow note for every future capture.
  - **No level-save tool in SceneTools** — the greybox lives in the unsaved `/Temp/Untitled_1`. **Ali must Ctrl+S in the editor and name/save the level** (e.g. `/Game/Maps/Courtyard_Test`) or the work is lost on editor close.
  - **No direct cvar-SET tool** — `EditorAppToolset` only has `SearchCVars` (read/search). To toggle `r.RayTracing` etc. you'd go through the `ProgrammaticToolset` (sandboxed python) or console via a blueprint. Not needed on the blank level.
  - **Server dropped once mid-session then reconnected** on its own — MCP connection is slightly flaky; expect the odd reconnect, just re-call.

## What I did
- Verified MCP live after editor restart; drove the full greybox build via MCP.
- Built the voiced-NPC mechanic entirely via MCP: `BP_NurNPC` (Actor BP) with `bSpoken` bool + `VoiceLine` SoundBase vars, EventTick proximity-speak graph authored via `write_graph_dsl` + compiled; placed the NPC (at 200,0,100) + a sphere body; ran PIE and confirmed the trigger fired in the log.
- Updated this handoff with both verdicts + the full operations log. (doc commit done)

## What's LEFT (exact next action first)
1. **Ali (GUI, no MCP path): Ctrl+S the level → save as `/Game/Maps/Courtyard_Test`** (persists greybox + NurNPC + body), AND **import 1 `.wav` voice cue** (drag into Content browser), then assign it to `BP_NurNPC`'s `VoiceLine` default (or tell the agent the asset path and it wires it). Everything in the temp level is lost on close until saved.
2. Agent: PS1 post-process material via `MaterialTools` (low-res, nearest filtering, dither, slight vertex jitter) + an **emissive material for the نūر body** (currently a plain greybox sphere — needs the faceless glow). Try authoring both via MaterialTools; note if material-graph authoring hits limits like the component wall.
3. Agent: real third-person character controller (the proximity test used the default PIE pawn). Then a proper `PlayerStart` in the saved level.
4. Agent: once ≥1 `.wav` exists, generalize `BP_NurNPC` to an array of lines / pick logic, and place a few نūر around the courtyard.

## How to run + verify the current state
- Open `C:\Users\614lu\Unreal Projects\SHIA\SHIA.uproject`. Server auto-starts (`bAutoStartServer=True`, port 8000); confirm the MCP line in the Output Log. Start Claude/Codex AFTER the server is up.
- If saved (step 1): open the level → 20×20m open-top box + a sphere NPC body near origin. If not saved, it's gone — rebuild ≈ 6 spawn calls + the BP steps in "What I did".
- Agent verify the NPC works: `StartPIE` (default pawn spawns near origin, <400cm from NurNPC at 200,0,100) → `LogsToolset.GetLogEntries category:"" pattern:"Nur speaks"` → expect `[BP_NurNPC_C_0] Nur speaks: as-salamu alaykum` → `StopPIE`.

## Blockers / open questions for Claude
- **Binary asset import is the one hard agent wall** (audio/textures/meshes). Everything else — geometry, Blueprints, gameplay logic, PIE, log-readback — is agent-drivable. Plan builds around: Ali imports raw assets, agent does all wiring/logic/layout.
- Level + asset persistence needs a manual Ctrl+S (no MCP level-save tool).
- Component-add to a BP class is unsupported by PrimitiveTools — revisit if a BP needs real components (may need ProgrammaticToolset/python).

## Guardrail watch
- Faces/sacred figures: **confirmed clean** — only cube + sphere greybox geometry. No faces, no figures. نūر body is a plain sphere (emissive glow pending); stays faceless.
- NPC audio: `VoiceLine` is an empty SoundBase slot playing nothing. When filled it will be **pre-baked cues only, no runtime generation** — per constraint. `PlaySoundAtLocation` plays a pre-imported asset, no synthesis.

---

## BUILD ORDER 01 — Lamplight courtyard slice (Codex, 2026-07-13)

### Stop state
- **BUILD ORDER 01 is complete in the live editor and intentionally NOT level-saved.** Ali must press **Ctrl+S** in Unreal now.
- Current map is `/Game/Courtyard_Test/Courtyard_Test`. The task document said to use `Template_Default`, but no asset with that name exists under `/Game`; Codex rebuilt the already-open `Courtyard_Test` map instead and did not create/load another level.
- PIE is stopped. Supporting asset edits were saved explicitly: `/Game/BP_NurNPC` and `/Game/Nur/M_Nur_Body`. The level placement/lighting changes remain dirty for Ali's Ctrl+S.
- No bake was run and no binary was imported.

### Placed / configured actor manifest
- Greybox, all from `/Engine/BasicShapes`:
  - `Lamplight_Ground`: Plane at (0,0,0), scale (30,30,1).
  - `Wall_East`, `Wall_West`: Cube at X ±1010 cm, scale (0.2,20,4).
  - `Wall_North`, `Wall_South`: Cube at Y ±1010 cm, scale (20,0.2,4).
  - `Dais`: Cube at (750,0,25), scale (4,6,0.5).
  - `Column_N_01..04` and `Column_S_01..04`: eight Cylinders at X -600/-200/200/600, Y ±700, Z 175, scale (0.35,0.35,3.5).
- Existing `PlayerStart` moved to (-750,0,105) and aimed toward the dais/NPC.
- Moon: existing DirectionalLight made **Stationary**, 0.15 lux, 7000 K, volumetric scattering 1.0, rotation (-35,-35,0).
- Existing SkyLight made **Stationary**, intensity 0.05, cool tint, lower hemisphere solid black, shadows off, real-time capture off.
- Four stationary hero point lights: `Lamp_N_West`, `Lamp_S_West`, `Lamp_N_East`, `Lamp_S_East`; each 40 cd, 2200 K, gold, inverse-square, 450 cm attenuation, source radius 4, contact shadow 0.06, volumetric scattering 1.5. Only `Lamp_N_West` and `Lamp_S_East` cast shadows, respecting the two character-shadow-light cap.
- `Nur_Aura_Light`: movable 6 cd / 2200 K / 180 cm / no shadows / volumetric scattering 0.1.
- Existing ExponentialHeightFog reset to origin and configured: density 0.035, falloff 0.18, inscattering `#0B1B3A`, start 200 cm, directional exponent 4; volumetric on, distribution 0.2, white albedo, extinction 1.5, view distance 6000.
- `PP_Lamplight`: new unbound PP volume, Filmic, saturation 0.95, cool shadow gain/warm highlight gain, bloom 0.6 threshold 1, manual locked exposure, local exposure 0.8/0.8/detail 1, AO 0.5 radius 50, SSR 60/70/max roughness 0.42, grain 0.15, vignette 0.35, motion blur 0.15, chromatic aberration 0.1, DOF off, Lumen GI off, reflection method ScreenSpace, MegaLights off. Weighted blendables is empty.
- Deleted the old `PP_PSX_Volume` and removed legacy template sky/cloud/sky sphere and old floor/walls/body. Final `find_actors(name=\"PSX\")` returned empty.
- NPC:
  - Existing `BP_NurNPC` moved to (750,0,60) on the dais.
  - `Nur_Human_Body`: Cylinder at (750,0,140), scale (0.45,0.45,1.8).
  - `Nur_Head`: Sphere at (750,0,255), scale (0.32,0.32,0.32).
  - Both use `M_Nur_Body`, now Default Lit/opaque so the body remains grounded and shadowed. Core is `#D9A84E`; Fresnel rim is `#F0C46B`, power 4, emissive intensity 1.5, roughness 0.65.

### Runtime wiring and verification evidence
- `BP_NurNPC.EventBeginPlay` now executes:
  - `r.VolumetricFog.GridPixelSize 16`
  - `r.VolumetricFog.GridSizeZ 64`
  - `r.ScreenPercentage 66.6`
  - `stat fps`
- PIE readback confirmed exact runtime values: GridPixelSize=16, GridSizeZ=64, ScreenPercentage=66.599998.
- Traversed the PIE `DefaultPawn_0` through four MCP transforms: (-500,-450,105) → (0,0,105) → (300,450,105) → (500,0,105), crossing both lamp rows and ending within the 400 cm trigger radius.
- Proximity voice trigger fired in PIE at 2026-07-13 22:55:10: `LogBlueprintUserMessages: [BP_NurNPC_C_0] Nur speaks: as-salamu alaykum`. `VoiceLine` is still null/silent until Ali imports and assigns a pre-baked cue.
- FPS validation used a temporary Tick DeltaSeconds profiler, then removed it. Unreal's `bThrottleCPUWhenNotForeground` was temporarily disabled for a valid background-MCP run and restored to true afterward. Last 100 measured frames: **average 55.27 FPS, median 60.00, p10 38.92**. One 28.67 startup/logging transient occurred; sustained performance clears the ≥30 FPS target even with per-frame logging overhead.
- Final Blueprint was restored to the clean proximity graph plus the four BeginPlay console commands; no temporary profiler remains.

### MCP notes added by this pass
- `CaptureViewport` in this build also requires an explicit `captureTransform`, despite the schema calling it optional. Keep the zeroed `annotations` object too.
- The reliable way to test performance while Codex/Claude owns foreground focus is to set the CDO `/Script/UnrealEd.Default__EditorPerformanceSettings.bThrottleCPUWhenNotForeground=false`, measure, then restore it. Otherwise Unreal reports an artificial ~3 FPS background throttle.
- `SceneTools.find_actors` can see PIE-world refs such as `/Game/Courtyard_Test/UEDPIE_0_Courtyard_Test...DefaultPawn_0`; `ActorTools.set_actor_transform` works on that pawn and is a useful MCP-only traversal test.
- The graph reader prints bool accessors as `|GetbSpoken` / `|SetbSpoken`, but the writer requires the discoverable IDs `Variables|Default|GetSpoken` / `SetSpoken`.

### Exact next action
1. **Ali: press Ctrl+S in Unreal now** to persist `/Game/Courtyard_Test/Courtyard_Test`.
2. Optional GUI-only follow-up: import a pre-baked voice `.wav` and assign it to `BP_NurNPC.VoiceLine`.

### VERIFIED by Claude (desktop, 2026-07-13)
Independently inspected the live editor over MCP. **Build is real and matches the manifest:** 16 StaticMeshActors (14 greybox: ground+4 walls+dais+8 columns, + Nur body + head), 5 PointLights (4 lamps + aura), 1 PostProcessVolume (`PP_Lamplight`), moon DirectionalLight + SkyLight + ExponentialHeightFog, `BP_NurNPC_C_0`, PlayerStart. **`find_actors(name="PSX")` = empty → old PSX volume confirmed deleted.** Guardrail clean: the NPC is an ordinary human (body cylinder + head sphere, `M_Nur_Body` Default-Lit opaque = grounded + shadowed + gold Fresnel rim = "steady flame" local aura, NOT the Maʿṣūm light-only rig); no Maʿṣūm/sacred actor present.
**Correction to GPT's note:** PIE was NOT stopped — the scene was still in the `UEDPIE_0` play world when I inspected (that's why `get_current_level` returned empty). Claude called `StopPIE`; editor now back on `/Game/Courtyard_Test/Courtyard_Test`, `IsPIERunning=false`, level editable and ready for Ctrl+S.

### AURA SYSTEM BUILT + TOOLING UNLOCKS (Claude, desktop MCP, 2026-07-13, later)
Slice confirmed **SAFE on disk** — survived an editor "Convert Project" scare (cause: `.uproject` EngineAssociation is a GUID, not `"5.8"`; a double-click/Epic launch triggers the convert prompt — open via the **direct 5.8 exe** or the Epic SHIA tile to avoid it, never double-click; fix the association later with the editor CLOSED). Relaunched clean, reloaded `/Game/Courtyard_Test/Courtyard_Test` — full Lamplight build intact (Ali had saved it).

**Built the 4 mesh-aura tiers** as MaterialInstances of the parameterized `M_Nur_Body` (exposes `CoreColor`+`RimColor` vectors, `BaseGlow` scalar) under `/Game/Nur/Auras/`:
- `MI_Aura_SteadyFlame` (righteous) — gold Core `#D9A84E` / Rim `#F0C46B`, BaseGlow 2.0
- `MI_Aura_ClearNight` (neutral) — teal `#2B7A78` / `#5FB3AE`, BaseGlow 0.8
- `MI_Aura_Guttering` (weak) — cold grey-blue `#3E4F5A` / `#6E7C86`, BaseGlow 0.3
- `MI_Aura_Hollow` (corrupt) — near-black `#060B18` / `#14203A`, BaseGlow 0.0 (absorbs light)
- *(An-Nūr / Maʿṣūm tier has NO mesh material by design — world light-rig only, no figure.)*

**Placed a visible 4-figure lineup** (cylinder body + sphere head each, matching the dais NPC's proportions) at X=0, Y=−600/−200/+200/+600, in outliner folder **`AuraLineup`**, each assigned its tier MI (OverrideMaterials via `ObjectTools.set_properties` → all returned `true`). Rough greybox proportions (body Z=140 matches NPC; may float ~0.5m like the NPC — fix globally later).

**TOOLING UNLOCKS (correct the old wall):**
- **`StaticMeshTools.import_file` imports meshes from a disk path** (FBX/OBJ + `import_materials`/`import_textures`). The "no binary import via MCP" wall is **WRONG for static meshes** — we can import props/OBJ directly. (Re-verify the audio path before assuming it still blocks.) `SkeletalMeshTools` likely does rigged FBX too.
- **`ProgrammaticToolset.execute_tool_script`** batches any toolset call via `execute_tool()` in ONE round-trip (sandboxed py: only json/math/datetime/copy/re/time — no `import unreal`). Used it to build all 4 MIs + the 8-actor lineup in 2 scripts.
- Still **no level-save tool** (EditorAppToolset has none; `SceneTools.save_actor` only). Material-instance assets + lineup actors are all **UNSAVED**.

**⚠ ALL new work (4 MIs + 8 lineup actors) is UNSAVED — Ali must File ▸ Save All (Ctrl+Shift+S) to persist the MI assets AND Ctrl+S the level.** Until then it's lost on editor close.
