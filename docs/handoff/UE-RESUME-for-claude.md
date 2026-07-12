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
| PS1 post-process material | not started | next; MaterialTools toolset present |
| Third-person walk | not started | |
| نūر NPC (faceless emissive) | not started | |
| Proximity voice trigger | not started | |
| 6–10 pre-baked voice lines | not started | needs audio import — unproven path |

## The go/no-go — answer with evidence
1. Performance (fps on the 4060 laptop): not a rigorous number yet. PIE ran fine on the greybox (trivial scene, expected). The real perf risk was `OpenWorld` + RayTracing/Substrate/VSM — we deliberately built on a **blank temp level** so that risk is sidestepped for the PS1 look. No fps concern for greybox-scale PS1 content.
2. Voice (NPC speaks on approach): **not yet answered** — NPC + audio import + proximity trigger not built. This is the remaining unknown.
3. MCP (agent did most editor ops): **YES, strongly. Feel: hours, not days.** Agent spawned 5 actors, positioned/scaled them, captured the viewport for visual verification, and started/stopped a PIE session — all via MCP with no GUI clicks.
→ Verdict: **GO for the MCP-driven build pipeline.** Greyboxing/level-dressing via agent is viable and fast. One unknown remains before full GO on the *game*: the voice/audio path (import + proximity trigger), which should be the next pipeline test.

## MCP operations — worked vs failed (MOST IMPORTANT)
- WORKED:
  - `list_toolsets` / `describe_toolset` — full toolset registry exposed (scene, actor, material, blueprint, static/skeletal mesh, data table, texture, programmatic python, etc.).
  - `SceneTools.add_to_scene_from_asset` — spawned 5 `StaticMeshActor`s from `/Engine/BasicShapes/Cube` with location+scale. Parallel calls in one message all succeeded (StaticMeshActor_1..5).
  - `SceneTools.get_current_level` — returns `/Temp/Untitled_1`.
  - `EditorAppToolset.CaptureViewport` with `captureTransform` override — got a PNG of the greybox for visual confirmation.
  - `EditorAppToolset.StartPIE` / `IsPIERunning` / `StopPIE` — play session started (warmup 2s, spawn override), confirmed running, stopped cleanly.
- FAILED / needed workaround (GOTCHAS — read before you build):
  - **`call_tool` `tool_name` must be the SHORT name** (e.g. `get_current_level`), NOT the fully-qualified `editor_toolset.toolsets.scene.SceneTools.get_current_level` that `describe_toolset` prints — the qualified form errors "Unknown tool". Pass the qualifier via the separate `toolset_name` arg.
  - **`CaptureViewport` requires the `annotations` object even when you don't want overlays** — it has no default; omitting it errors "input param annotations needs a default value". Pass all fields zeroed + `classFilter: null`.
  - **Viewport/editor image data comes back as inline base64 (~1.1M chars) and blows the context window.** Never read it inline. It auto-spills to a tool-results `.txt`; decode with python (`json → returnValue.image.data → base64.b64decode → write .png`) and Read the PNG file. Workflow note for every future capture.
  - **No level-save tool in SceneTools** — the greybox lives in the unsaved `/Temp/Untitled_1`. **Ali must Ctrl+S in the editor and name/save the level** (e.g. `/Game/Maps/Courtyard_Test`) or the work is lost on editor close.
  - **No direct cvar-SET tool** — `EditorAppToolset` only has `SearchCVars` (read/search). To toggle `r.RayTracing` etc. you'd go through the `ProgrammaticToolset` (sandboxed python) or console via a blueprint. Not needed on the blank level.
  - **Server dropped once mid-session then reconnected** on its own — MCP connection is slightly flaky; expect the odd reconnect, just re-call.

## What I did
- Verified MCP live after editor restart; drove the full greybox build via MCP (uncommitted editor state — level unsaved, see gotcha).
- Updated this handoff with the verdict + operations log. (doc commit pending)

## What's LEFT (exact next action first)
1. **Ali: Ctrl+S the level in the SHIA editor and save it as `/Game/Maps/Courtyard_Test`** so the greybox persists. (Only Ali/GUI can, no MCP save.)
2. Next pipeline test — the real unknown — **voice**: import 1 test audio cue, spawn a نūر NPC (faceless emissive sphere/capsule), add a proximity trigger that plays the cue on approach. Prove the audio-import + trigger path via MCP (or find where MCP can't and Ali must click).
3. PS1 post-process material via `MaterialTools` (low-res, nearest filtering, dither, slight vertex jitter) — cosmetic, lower priority than the voice test.

## How to run + verify the current state
- Open `C:\Users\614lu\Unreal Projects\SHIA\SHIA.uproject`. The server auto-starts (`bAutoStartServer=True`, port 8000); confirm the MCP line in the Output Log.
- If the greybox was saved (step 1 above): open that level. You should see a 20×20m open-top box (floor + 4 walls, ~3m tall) at world origin. If not saved, it's gone — rebuild is ~6 MCP spawn calls.
- Agent verify: `get_current_level`, then `find_actors` or `CaptureViewport` (decode PNG to file).

## Blockers / open questions for Claude
- Audio import path via MCP is unproven — may be the first place the agent hits a wall and Ali must import via GUI. That's the whole point of the next test.
- Level persistence needs a manual save each session (no MCP save tool found).

## Guardrail watch
- Faces/sacred figures: **confirmed clean** — nothing built but plain cube geometry. No faces, no figures. نūر-NPC will be faceless emissive only.
- NPC audio: not built yet; when built it will be **pre-baked cues only, no runtime generation** — per constraint.
