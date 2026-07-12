# HANDOFF → GPT-5.6 — "World & Atmosphere" pass

You are an autonomous coding agent picking up a live project. This file is your
complete brief — you do **not** have the prior conversation. Read it fully, then
work. **You may run out of turns mid-task; that is expected.** Section 7 tells you
how to stop cleanly so another agent (Claude) can resume. Producing the resume file
in Section 8 is part of the job, not an afterthought.

---

## 0. TL;DR
- Project: **The Path of Light** — a mobile-first browser PWA, a walkable retro low-poly 3D Baghdad that teaches Shia hadith-verification method. Repo root: `C:\ProjectX\shia-path`. Live: https://alikhiq.github.io/the-path-of-light/
- Your task: 4 self-contained quality upgrades (Section 3). No new gameplay systems, no content rewrites.
- Work on a branch `world-pass` (NOT `main` — `main` auto-deploys to the live site). Commit per sub-task.
- After every sub-task, update `docs/handoff/RESUME-for-claude.md` (Section 8). When you stop for any reason, finalize it.

---

## 1. Project context
- Static site, no build step, no npm. Plain HTML/CSS/JS + Three.js r128 loaded from cdnjs (global `THREE`, **not** ES modules).
- Run locally: `python -m http.server 8080` in the repo root, open `http://localhost:8080`. (A service worker + WebGL need `http://`, not `file://`.)
- Deploy = `git push origin main` → GitHub Pages rebuilds in ~60s. **You are NOT deploying.** Stay on `world-pass`.
- It is a PWA: `manifest.webmanifest` + `sw.js` (service worker is **network-first** for same-origin, so a normal reload gets your latest code — no cache-busting needed while developing, but keep the dev tab focused; see Section 9).

## 2. Architecture map (read these files first)
| File | Role |
|---|---|
| `index.html` | App shell. Two screens: `#hub` (chapter select) and `#chapter` (the 3D view + HUD overlays). Modals: `#dialogue`, `#casebook`, `#suggest`, `#opening`. Loads `config.js`, `content.js`, three.js CDN, `world.js`, `game.js` in that order. |
| `content.js` | **The story.** `window.CONTENT` = `{ hub, chapters:[...] }`. Each chapter: `{id, order, difficulty:'easy'|'mid'|'hard', badge, place, era, title, teaser, objective, tint:'warm'|'neutral'|'cool', teacher:{name,role,...}, guide, clues:[{key,title,hint,copy,x,y,decoy?}], intro:[dialogueSteps], resolve:[dialogueSteps], sources:[...], guardrail}`. **Do not change the wording/meaning of any educational text.** You may ADD fields (e.g. `clue.prop`, `chapter.landmark`). |
| `world.js` | **The 3D engine.** IIFE exposing `window.World`. Builds the walkable district, places markers, first-person controls, collision, proximity interaction. This is where most of your work happens. |
| `game.js` | Game logic: hub, branching dialogue, investigation, save (`localStorage`), casebook, suggestion box, PWA. Drives `world.js`. |
| `styles.css` | Mobile-first, safe-area aware. Palette in `:root` (navy `--navy` #0a1730, gold `--gold` #f2cd6a, teal `--teal` #3fb7b7). |
| `config.js` | Supabase publishable url+key (safe, public). **Do not touch.** |
| `sw.js` | Service worker. If you add asset files to precache, add them to `CORE` and bump `CACHE` (`pol-v3` → `pol-v4`). |

### The World API contract — DO NOT BREAK THESE SIGNATURES
`game.js` calls only these. Keep them working exactly:
```
World.load(chapter, { onExamine(key), onSpeak() })  // build + start a chapter
World.unload()                                        // stop + dispose
World.setFound(key)                                   // dim an examined clue marker
World.setFocus(bool)                                  // reveal all markers (Scholar's Focus)
```
- `onExamine(key)` must fire when the player interacts with a clue marker (key = `clue.key`).
- `onSpeak()` must fire when the player interacts with the teacher marker.
- DOM ids `world.js` owns: `#world` (canvas), `#worldLabels`, `#interactPrompt`, `#interactText`, `#actBtn`, `#joy`, `#knob`, `#touchControls`.
- Controls: desktop = click-to-pointer-lock + WASD + mouse-look + `E`; touch = left joystick + drag-look + EXAMINE button.
- Movement pauses automatically while any modal overlay is open (see `modalOpen()` in `world.js`).

## 3. YOUR TASK — 4 sub-tasks (do in this order; each ships independently)

### A. Distinct clue props  *(replaces identical marker cylinders)*
Today every clue is the same glowing cylinder (`addMarker` in `world.js`). Make each clue a recognizable low-poly prop cluster so exploration teaches by sight.
- Add an optional `prop` field per clue in `content.js` (e.g. `prop:"stall" | "lectern" | "pots" | "stele" | "figure"`). Default to a generic prop if absent.
- Build flat low-poly clusters: **stall** = stacked crates + angled "pages" planes; **lectern** = angled stand + scroll; **pots** = cluster of low-poly urns; **stele** = tall dated stone slab; **figure** = a robed SILHOUETTE pillar (a tapered body shape, hood — **absolutely no face/eyes**).
- Keep: the glowing accent, the floating `.wlabel`, the proximity+interact behavior, and the teal(normal)/orange(decoy) color coding.
- **Accept when:** each clue is visually distinct; all still examinable via proximity+E/tap; labels still track; works in all 3 chapters; total draw calls stay reasonable (target < ~150).

### B. Per-chapter districts
Today `seed` is hardcoded (`let seed = 7`) and all 3 chapters render the identical four-block layout.
- Derive the seed from the chapter (e.g. a small hash of `chapter.id`) so each chapter's building cluster differs.
- Add ONE landmark per chapter via a `chapter.landmark` field or by `chapter.id`: ch1 (`verify`) a **library/House-of-Wisdom facade**, ch2 (`chains`) a **columned court**, ch3 (`chronology`) a **hall of dated steles / small observatory**. Low-poly, on-theme, gold-on-navy.
- **Accept when:** the 3 chapters look visibly different; every clue + the teacher remain reachable (no marker trapped inside a collider); collision still blocks buildings; player still spawns facing the district; no console errors.

### C. Ambient audio (WebAudio, environmental only)
- Use the WebAudio API. Prefer synthesized tones / filtered noise (no external files); if you must use samples, embed tiny ones as data URIs. **No instrumental music** (contested in conservative homes) — environmental only: a soft wind bed, faint fountain trickle near the plaza, a gentle **chime on evidence found** (hook into the `setFound` path), a soft tick/turn on dialogue advance.
- Autoplay policy: start the audio context only after the first user gesture (the "Enter the city" / first tap). Provide a **mute toggle** (add to the `.quick-nav` or a settings control) that persists in `localStorage`. Default to sound ON but gated on gesture; if WebAudio is unsupported, degrade silently.
- **Accept when:** ambience starts after a user gesture (no autoplay-blocked console errors); chime fires on pickup; mute toggles + persists across reloads; silent + error-free if unsupported.

### D. Dialogue juice
- **Typewriter** reveal for `#dText` (character-by-character), **skippable**: a tap/click/Enter instantly completes the current line. Don't block choosing.
- **Count-up** animation when Insight/Trust change (the `#insight`/`#trust` and hub values).
- A small **gold pip/particle pop** at pickup (on `setFound`) — CSS or a tiny canvas burst, cheap.
- Respect `prefers-reduced-motion`: instant text, no particles, no count-up.
- **Accept when:** text types + is skippable; stats count up; pickup pops; reduced-motion path is instant; no layout shift or errors.

**OUT OF SCOPE (do not build):** the interactive sanad diagram (Claude owns that), new chapters, content/wording changes, login/accounts, changing the Supabase or deploy setup, any depicted human face.

## 4. HARD RULES / guardrails (non-negotiable)
1. **No depicted faces, anywhere.** Humans = robed silhouettes or the gold calligraphic seal only. No eyes, no facial features. This is a Shia Islamic educational game; realistic faces are out by design.
2. **Do not alter the meaning of educational text** in `content.js` (dialogue, sources, guardrail notes). Add fields; never rewrite copy. If a change seems needed, flag it in the resume file for scholar review — do not just do it.
3. Keep every existing guardrail string and the "no sacred figures / no depicted faces" hub note intact.
4. Audio = environmental only, muteable. No music.
5. Keep it **mobile-first, retro low-poly, and performant.** No heavy textures, no huge libraries. Three.js r128 global only.
6. **Do not break the World API** (Section 2) or `game.js` integration. Test that the full loop still works: hub → enter chapter → intro dialogue → walk → examine all clues → return to teacher → resolve → complete → next chapter unlocks.
7. Do not touch `config.js`, `sw.js` caching strategy (you may add to `CORE` + bump `CACHE`), or the Supabase table.

## 5. How to work
- `git checkout -b world-pass` off `main`. Do all work there. Do **not** push to `main`.
- One commit per completed + tested sub-task. Clear messages (`feat: distinct clue props`, etc.).
- Test in a **focused** browser tab at `http://localhost:8080` (see Section 9 re: background tabs). Manually play through all 3 chapters for each change.
- Keep changes surgical and reversible.

## 6. Documentation protocol (do this continuously)
- Maintain `docs/handoff/RESUME-for-claude.md` (skeleton already exists). After **each** sub-task or meaningful decision, update it. Treat it as a live log, not a final report.
- Also keep inline code comments minimal but honest where you do something non-obvious (e.g. why a collider was sized a certain way).

## 7. STOP protocol — READ THIS (you may be interrupted)
The moment you sense you are near a turn/message limit, hit a blocker, or finish — **stop adding code and finalize `docs/handoff/RESUME-for-claude.md`**. A half-done task with a precise resume file is far more valuable than more code with no map. Then commit that file. Specifically, before you go:
1. Fill every section of the resume template (Section 8) — no blanks.
2. Record exact commit hashes: `git log --oneline -n 10`.
3. State the **single next action** in one sentence.
4. List anything risky Claude must double-check (especially any content or guardrail edge you touched).
5. `git add -A && git commit -m "docs: resume handoff @ <task/step>"` on the `world-pass` branch.

## 8. The resume file you must produce → `docs/handoff/RESUME-for-claude.md`
A skeleton is committed at that path. Keep this exact structure and fill it in:

```markdown
# RESUME → Claude — World & Atmosphere pass
_Updated: <date> · Agent: GPT-5.6 · Branch: world-pass · Last commit: <hash>_

## Status
| Task | State | % | Notes |
|------|-------|---|-------|
| A. Distinct clue props | not started / in progress / done | 0 | |
| B. Per-chapter districts | not started / in progress / done | 0 | |
| C. Ambient audio | not started / in progress / done | 0 | |
| D. Dialogue juice | not started / in progress / done | 0 | |

## What I did
- <bullet: change, files touched, commit hash>

## What's LEFT (in order, precise)
1. <exact next step — a Claude agent should be able to start here cold>

## How to run + verify current state
- <commands + what to click + expected result>

## Decisions I made (and why)
- <decision → reason>

## Blockers / open questions for Claude
- <blocker, or "none">

## Guardrail / content watch (double-check these)
- <anything touching faces, content wording, sensitivity — or "nothing touched">
```

## 9. Gotchas / environment notes
- **Background tabs freeze the 3D loop.** `requestAnimationFrame` is throttled when the tab/window isn't the active painting surface (`document.visibilityState === "hidden"`). If the world looks frozen, focus the tab. This is not a bug.
- Movement/interaction is gated on `!modalOpen()`; the intro dialogue is open when a chapter starts, so the player can't move until they pick the first choice (`to:"investigate"` closes it).
- Three.js is **r128 global** (`THREE.*`). No `import`. `MeshBasicMaterial`/`MeshLambertMaterial` only; keep it flat.
- Line-ending CRLF warnings from git on Windows are harmless.
- Collision is circle-vs-AABB, axis-separated (`step()` in `world.js`), colliders are pushed in `buildDistrict()`. If you add solid props/landmarks, push their AABBs to `colliders` or the player walks through them; if you add decorative props, don't (keeps the count low).
- `player` spawn is `(0,1.6,22)`, yaw 0 (facing −z into the district); teacher at ~`(0,-15)`; clue slots in `load()`. Keep clues in walkable street/plaza space, not inside blocks.

## 10. Definition of done (whole pass)
All 4 tasks meet their accept criteria; the full chapter loop works on desktop AND a mobile viewport; no console errors; `prefers-reduced-motion` respected; `RESUME-for-claude.md` finalized; everything committed on `world-pass`. Claude will review, verify, and merge to `main` (deploy).
