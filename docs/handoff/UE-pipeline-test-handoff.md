# HANDOFF → GPT-5.6 — UE5 pipeline test ("The Circle courtyard")

> ✅ **TEST COMPLETE + ⚠️ LOOK RETIRED (2026-07-12).** The pipeline test PASSED (MCP drives the editor — greybox courtyard, voiced نūر NPC, materials, all agent-built). But its **PS1 / faceless-نūr look is retired**: v1 is now **real human characters + auras** ([`../art-bible-faces-and-auras.md`](../art-bible-faces-and-auras.md)) in the **"Lamplight Realism"** render target ([`../lamplight-realism-4060-build-spec.md`](../lamplight-realism-4060-build-spec.md)). Read below only as the historical test brief; build to the lamplight spec.

You are an autonomous coding agent driving **Unreal Engine 5.8** through its **MCP server**. This is your complete brief — you do **not** have the prior conversation. Read it fully. **You may run out of messages mid-run; that is expected.** Section 7 tells you how to stop so Claude can resume from `docs/handoff/UE-RESUME-for-claude.md`. Producing/updating that resume file is part of the job.

---

## 0. TL;DR
- This is **not** building the game. It is **one disposable test** that answers a single question: *can an AI agent + this hardware actually run a UE5 pipeline?*
- Deliverable: **one PS1-style Baghdad courtyard, walkable, with one voiced نūر NPC.** Willing to throw it away.
- The real test subject is **the MCP loop itself** — you driving the editor. **Log every MCP operation that works and every one that fails.**
- Timebox: **2 weeks.** Stop when the go/no-go (Section 6) is answerable.

## 1. Context
- Project: **The Path of Light** — a reverent Twelver Shia tazkiya game. The shipped version is a live browser game; this UE track is a horizon experiment.
- UE **5.8** has an official **MCP server** in the editor — you drive it (spawn actors, lighting, materials, Blueprints, run Python).
- Hardware reality: dev laptop is an **RTX 4060 Laptop, 16 GB RAM, ~62 GB free** — modest. Keep the scene TINY. There are ~10 other machines but only for *parallel* bakes/render later, not one pooled instance. Do not assume horsepower.
- Reference proof this is doable solo: *Grandpa High on Retro* (one dev, UE5 PS1 look, AI voice).

## 2. The art bible (obey it exactly)
The full نūر / PS1-Baghdad art bible + 30 reference prompts are in **`docs/ue5-concept-prompts.md`** — read it. The essentials:
- **Elevated PS1-retro:** chunky faceted geometry, 128–256px dithered/affine textures, vertex wobble, fog — but cinematic lighting.
- **Two-light doctrine:** warm oil-lamp gold (~2200K) vs cool moonlight (~7000K); gold pools in oceans of navy. Night only.
- **Palette:** navy-lapis `#0B1B3A`/`#1E3A8A`, lamp gold `#D9A84E`/`#F0C46B`, teal `#2B7A78`, mudbrick ochre `#7A5C3E`, near-black `#060B18`.
- **نūر light-beings:** faceless warm-golden glowing robed silhouettes — **NO eyes, mouths, faces, skin, hair, EVER. NO sacred figures.** Emissive material + soft bloom.

## 3. Build for real
- A **greybox courtyard** — ~20×20 m: mudbrick walls, a couple of horseshoe arches, a central low flame/brazier, floor. Low-poly, PS1 texture budget.
- A **PS1 post-process material** — vertex snapping, affine/low-res texture feel, dither, short draw distance + fog. The look is a *shader*, not an asset problem.
- **Default third-person** template character walk. No custom character.
- **One نūر NPC** — an emissive faceless light-form (our no-face rule conveniently means no lip-sync problem). Idle + a proximity trigger.
- **The MCP loop** (the actual test): you place actors, set lighting, create/edit the material, build the trigger Blueprint — all through the MCP. **Log each operation: worked / failed / needed a workaround.**

## 4. Fake shamelessly
- **Voice = 6–10 pre-baked audio files** generated once (ElevenLabs or local TTS) and dropped in. **No runtime LLM, no live speech-gen** — this is a guardrail, not just a shortcut: an NPC must NEVER generate religious content at runtime.
- No menus, no save, no quests, no UI, no optimization pass, no packaging for other machines. Marketplace/Quixel freebies or plain greybox — zero art hours.

## 5. Guardrails (non-negotiable)
1. **No depicted faces / sacred figures** — نūر light only.
2. **NPC lines are pre-approved audio only** — never runtime-generated.
3. Period-accurate Abbasid Baghdad, night, the palette above. No modern objects.
4. Keep the scene tiny (16 GB RAM / 62 GB disk). Watch draw calls + memory.

## 6. Go / no-go (the whole point)
Answer these three, then stop:
1. **Performance:** does the courtyard hold **30+ fps** (ideally 60) on the 4060 laptop?
2. **Voice:** does the NPC **speak** (play its audio) when the player approaches?
3. **MCP:** did **the AI agent perform the majority of editor operations through the MCP** — did iteration feel like hours, not days?

**All three yes → GO:** the UE track opens at WIP=1, browser freezes to maintenance. **Any no (MCP flaky / laptop can't hold editor+game) → NO-GO:** park UE as a manual weekend hobby, the browser stays the vehicle — zero shame.

## 7. Work protocol + STOP protocol
- Work in the UE project's own git (or a `ue/` folder); commit small and often. Keep a running MCP-operations log (`docs/handoff/UE-mcp-log.md`).
- The moment you near a message limit, hit a blocker, or finish: **stop and finalize `docs/handoff/UE-RESUME-for-claude.md`** (skeleton already committed). Fill every section: what's done, exact next action in one sentence, which MCP operations worked vs failed (this is the most valuable output), blockers, how to verify. Commit it. A precise resume file beats more half-done editor work.

## 8. Definition of done
Either the go/no-go is answered with evidence, or the resume file precisely hands off a partial state. The MCP-operations log is the deliverable that matters most — it tells Claude (and Ali) whether the AI-driven UE pipeline is real.
