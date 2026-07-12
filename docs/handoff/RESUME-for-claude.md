# RESUME → Claude — World & Atmosphere pass
_Updated: 2026-07-12 · Branch: world-pass · Status: COMPLETE (ready to merge)_

> Task A + start of B done by GPT-5.6; B verified & committed, C + D implemented by Claude
> after GPT hit its usage limit. All four tasks done, verified, committed on `world-pass`.

## Status
| Task | State | % | Notes |
|------|-------|---|-------|
| A. Distinct clue props | done | 100 | GPT-5.6 (`98df904`). Five flat prop builders; 3 distinct silhouettes per chapter. |
| B. Per-chapter districts | done | 100 | GPT-5.6 work, verified + committed by Claude (`31c630e`). seedFrom(id), footprint jitter, 3 landmarks (library/court/observatory). |
| C. Ambient audio | done | 100 | Claude (`2d711dd`). audio.js WebAudio bed + chime + tick; mute in quick-nav, persisted; silent fallback. |
| D. Dialogue juice | done | 100 | Claude (`2d711dd`). Typewriter (click/Enter skip), count-up, evidence particle; reduced-motion aware. |

## What was done
- **A (GPT):** `clue.prop` metadata in content.js; stall/lectern/pots/stele/figure/generic builders in world.js. Figure is a featureless robed silhouette (no face). Labels/proximity/focus/glow preserved.
- **B (GPT, verified by Claude):** `buildDistrict(chapter)` seeds RNG from `chapter.id`; building jitter + size variation; three landmarks placed at the north boundary or atop already-solid blocks so clue slots + the street cross are unchanged. Verified all 3 chapters: 4 markers each, render, `node --check` clean, no console errors.
- **C (Claude):** `audio.js` — filtered-noise wind bed (per-tint lowpass, slow LFO), rising-triad chime on evidence, faint tick on dialogue advance. Gesture-gated (created on Enter-the-city / first tap), mute button in `.quick-nav` persisted to `pol-muted-v1`, degrades silently with no WebAudio. Hooked in game.js (startBed on enter, stopBed on back/complete, chime+burst on real clue, tick on choice).
- **D (Claude):** typewriter reveal for `#dText` with click/Enter skip; insight/trust count-up in `syncHud`; gold particle burst on pickup. All guarded by `prefers-reduced-motion`.
- Removed the temporary `work/world-test.html` QA harness (was never meant to ship).

## Verification
- `node --check` clean on world.js, content.js, game.js, audio.js.
- All 3 districts load with 4 markers, distinct landmarks, no console errors.
- Typewriter types + skips to full; mute toggles both ways; count-up reaches target; particles + chime fire without error.

## What's LEFT
1. Merge `world-pass` → `main` and `docs-launch` → `main`, then deploy (git push; GitHub Pages).
2. Future work is in `docs/roadmap.md` (interactive sanad diagram is the top item, reserved for Claude).

## Guardrail / content watch
- No educational, source, dialogue, guardrail, or hub-note wording changed. Only additive fields (`clue.prop`, `chapter.landmark`).
- The `figure` prop and all human representation remain faceless. Audio is environmental only (no music) and muteable.
