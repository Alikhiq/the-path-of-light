# RESUME → Claude — World & Atmosphere pass
_Updated: 2026-07-12 · Agent: GPT-5.6 · Branch: world-pass · Last commit: 98df904_

## Status
| Task | State | % | Notes |
|------|-------|---|-------|
| A. Distinct clue props | done | 100 | Five flat prop builders; each chapter uses three distinct silhouettes. |
| B. Per-chapter districts | not started | 0 | Next task. |
| C. Ambient audio | not started | 0 | Awaiting Task B. |
| D. Dialogue juice | not started | 0 | Awaiting Task C. |

## What I did
- Task A (`98df904`): added optional `clue.prop` metadata in `content.js` and low-poly stall, lectern, pots, stele, figure, and generic fallback builders in `world.js`.
- Preserved marker labels, proximity callbacks, focus visibility, and teal/orange glow behavior. The figure is a featureless tapered robe and hood with no face-facing detail.
- Validated JavaScript syntax, diff whitespace, allowed/unique props per chapter, and chapter 1 rendering in the focused in-app browser; no browser console warnings/errors.

## What's LEFT (in order, precise)
1. Start Task B by changing `buildDistrict(tint)` to receive the chapter, derive its RNG seed from `chapter.id`, and add the three reachable, chapter-specific landmarks without obstructing clue slots or the teacher.
2. Implement Task C environmental WebAudio and persistent mute control.
3. Implement Task D typewriter, stat count-up, and reduced-motion-aware evidence particle.
4. Run the complete desktop/mobile/reduced-motion chapter loop and final draw-call/console checks.

## How to run + verify current state
- Run `python -m http.server 8080` in the repo root and open http://localhost:8080 in a focused tab.
- Enter the city → Sequence 01 → choose the correct first response → “I will look before I judge.” The manuscript stall, courtyard stele, and pottery cluster render at their existing marker positions with floating labels.
- Use WASD + E (desktop) or joystick + EXAMINE (touch) to verify the unchanged proximity callbacks; toggle Scholar's Focus to verify marker reveal behavior.
- Run `node --check world.js`, `node --check content.js`, and `git diff --check` for static validation.

## Decisions I made (and why)
- Assigned three different prop types within every chapter so local clue silhouettes never repeat, while reusing prop vocabulary across chapters to keep the mesh/draw-call cost restrained.
- Kept interaction props decorative (no new colliders) so their existing street/plaza slots remain reachable and the gameplay collision contract does not change.
- Kept the colored interaction signal on the glow and one small prop accent; the main forms use muted wood, clay, stone, paper, or navy materials so decoy orange remains legible without recoloring whole artifacts.

## Blockers / open questions for Claude
- None.

## Guardrail / content watch (double-check these)
- No educational, source, dialogue, guardrail, or hub-note wording changed; only `prop` fields were added to clue objects.
- The `figure` prop is intentionally faceless: tapered seven-sided robe, partial-sphere hood, and base accent only. Do not add a face plane, eyes, or features during later polishing.
