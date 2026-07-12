# The Path of Light

A mobile-first browser game that teaches the Twelver Shia method of verifying a report — sanad and matn, narrator criticism (rijal), and chronology — by walking a fictional, low-poly 3D Baghdad.

**Live:** https://alikhiq.github.io/the-path-of-light/

![The Path of Light — hub screen](docs/screenshot-hub.png)
<!-- Add a real screenshot at docs/screenshot-hub.png (e.g. the chapter-select hub or a chapter's street view). -->

## What it teaches

Across 3 chapters, the player investigates a saying moving through the market and learns to ask the right questions before trusting it:

1. **The Unbroken Chain** — sourcing a claim before believing it (does a good meaning prove who said it?).
2. **Names in the Chain** — weighing individual narrators (`ilm al-rijal`): honesty, precision, and whether a narrator is even known.
3. **Broken by Time** — chronology (`ittisal`): a chain can name only respected people and still be impossible if two narrators never overlapped in life; the wording itself (`matn`) can also expose a fabrication.

Every chapter ends by recording evidence and deferring the verdict to qualified scholars — the game never lets the player "rule" on a report.

### Guardrails (non-negotiable, enforced in code and content)

- **No depicted faces, anywhere.** People are gold calligraphic seals or featureless robed silhouettes (see `figure` prop in `world.js`) — no eyes, no facial features, no sacred figures shown or implied.
- **Teaches the method, never grades a real hadith.** All chapters, narrators, and reports are fictional teaching scenarios built around real verification principles.
- **Production content is pending review by qualified Twelver Shia scholars** — see [`docs/scholar-onboarding.md`](docs/scholar-onboarding.md) and [`docs/scholar-review.md`](docs/scholar-review.md).
- Guardrail language is embedded directly in the content (`chapter.guardrail`, the hub note, and in-game source notes) and must not be removed or reworded without scholar sign-off.

## Not a source of religious rulings

**This game is not a fatwa engine, a hadith database, or a substitute for qualified scholarship.** It does not authenticate real hadith and must never be treated as evidence for or against any actual report. For real religious questions, consult a qualified Twelver Shia scholar (marja' or equivalent).

## Tech stack

- **Three.js r128** — global `<script>` build from cdnjs (`THREE.*`), **no bundler, no ES modules, no npm**
- **Vanilla HTML/CSS/JS** — no framework
- **localStorage** — save/progress (`pol-save-v1`)
- **Supabase** (Postgres + REST) — suggestion box, anonymous insert-only via Row Level Security, publishable key in `config.js`
- **Service worker + Web App Manifest** — installable, offline-capable PWA
- **GitHub Pages** — static hosting, no build step

## Run locally

```powershell
cd C:\ProjectX\shia-path
python -m http.server 8080
```

Then open `http://localhost:8080`. Serve over `http://`, not `file://` — the service worker and WebGL context both require it.

## Project structure

| File / path | Role |
|---|---|
| `index.html` | App shell. Two screens (`#hub` chapter-select, `#chapter` 3D view + HUD) and modals (`#dialogue`, `#casebook`, `#suggest`, `#opening`). Loads `config.js` → `content.js` → Three.js (CDN) → `world.js` → `game.js`, in that order. |
| `content.js` | **All story content.** `window.CONTENT` — hub text and every chapter's dialogue, clues, sources, and guardrail copy. Scholar-editable; see below. |
| `game.js` | Game logic: hub rendering, branching dialogue, evidence tracking, casebook, save/load, the suggestion box, and PWA install prompt. Drives `world.js` via a small API. |
| `world.js` | The walkable 3D engine (Three.js). First-person movement/collision, per-chapter district generation, clue/teacher markers, proximity interaction. Exposes `World.load/unload/setFound/setFocus`. |
| `config.js` | Public runtime config — Supabase URL and **publishable** anon key (safe to ship; RLS restricts it to anonymous INSERT on one table). |
| `sw.js` | Service worker — network-first for same-origin (so redeploys are picked up immediately), cache-first for CDN assets; powers offline play. |
| `styles.css` | All styling — mobile-first, safe-area aware. |
| `manifest.webmanifest` | PWA manifest (install-to-homescreen metadata). |
| `assets/` | Images: hub art, street backgrounds, app icon. No depicted faces per the guardrails above. |
| `docs/handoff/` | Live agent-to-agent status log for in-progress engineering passes. |
| `docs/scholar-review.md` | Claim-by-claim review checklist + sign-off table for scholars. |
| `docs/scholar-onboarding.md` | How a scholar safely reviews/edits content. |
| `docs/roadmap.md` | Future chapters, feature backlog, and audience-reach plans. |
| `docs/ideas/path-of-light.md` | Original concept notes. |

## How content editing works

`content.js` is the one file meant for **non-engineers** to edit: it holds every word of dialogue, every clue description, and every source note as a plain JavaScript object (`window.CONTENT`). A scholar or teacher can open it in any text editor and change the text inside quotation marks without touching code elsewhere. Full guidance — including exactly what to check before signing off on content — is in [`docs/scholar-onboarding.md`](docs/scholar-onboarding.md).

## Deploy

Deploying is `git push origin main` — GitHub Pages rebuilds the live site in about a minute. Feature work happens on branches (e.g. `world-pass`) and is merged to `main` only when verified, since `main` auto-deploys.

## Status & roadmap

This project is under active development. For the current state of in-progress work, see [`docs/handoff/GPT-world-pass-handoff.md`](docs/handoff/GPT-world-pass-handoff.md) and [`docs/handoff/RESUME-for-claude.md`](docs/handoff/RESUME-for-claude.md). Future direction is in [`docs/roadmap.md`](docs/roadmap.md); original concept notes in [`docs/ideas/path-of-light.md`](docs/ideas/path-of-light.md). Content is in **draft** status pending qualified-scholar review before wider release.
