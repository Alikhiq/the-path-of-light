# UE RESUME → Claude — pipeline test
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
