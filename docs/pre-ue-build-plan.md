# Everything We Need Before We Set Up Unreal Engine
**Bayt al-Nūr — master build plan.** One track at a time (WIP=1). The engine can wait; the work cannot be rushed into it. *Authored by Fable 5, with design authority.*

---

## 0. The Readiness Bar
UE is not worth a single hour until **every** line is true. This list is the wall against a premature pivot.

- [ ] Arc 1 (browser) is **closed** — QA'd, accessible, nothing half-built.
- [ ] The **Bayt al-Nūr hub page** is live — the single front door.
- [ ] At least one qualified scholar has the **review form in hand**, with a follow-up cadence running.
- [ ] The **pipeline-test spec** exists on paper, with a written go/no-go sentence.
- [ ] **Disk solved** — 67 GB free is not enough. Buy a 1 TB external NVMe, or clear 120 GB+.
- [ ] **AI-voice key** acquired, 3 test lines generated, distribution license confirmed.
- [ ] **UE 5.8 MCP verified** as actually working — not announced, *working*.

Six paper checkboxes and one hardware. None require Unreal installed.

## 1. Browser track — finish first (WIP=1, in order)
1. **QA/regression gate** — a written manual test script (fresh phone install, offline PWA update, iOS audio unlock, save survives auto-update, low-end pass). Run it, fix failures, keep it as the gate for every future deploy.
2. **Accessibility pass** — contrast, tap targets, reduced-motion toggle, font scaling, glossary legibility. Elders + children in the audience → treat as canon, not polish.
3. **Guardrail lint** — a script over the content that flags ruling-shaped language ("obligatory/forbidden"), any face/figure reference, narrations without a source entry, Arabic terms missing glossary links. The guardrails must survive *us on a tired day* — make them mechanical.
4. **The Researcher ledger** (§6).

**Arc 2: do NOT build it now — WRITE it** (full station scripts, sources, Mirror beats, its Return) as engine-agnostic content. Words port; code doesn't. If the UE test fails, Arc 2 ships in browser with no loss. If it passes, Arc 2 becomes UE's first content.

**Skip entirely:** accounts, leaderboards, analytics beyond a counter, localization expansion, app-store wrapping, more audio layers, multiplayer of any kind.

## 2. The Hub — Bayt al-Nūr's web home
One **static page** (not an app). Night-Baghdad / نūر-gold palette. Five doors: **the Path** (the game), **the Āyāt** (the engines), **the Oven** (an "in production, under review" card — no footage), **the Majlis** (the scholar-review form, plain + professional), **the suggestion box**. One paragraph of framing: what this house is, what it will never do (issue rulings, depict the sacred). This is what a marjaʿ's office sees first — one evening of work that makes every other conversation credible.

## 3. The Āyāt engines
Fourteen of thirty is enough. **Stop building; start curating.** Pick the strongest, give each a title card (verse · translation · one line on the visual logic), mount them as a **gallery behind the hub**. The other ~16 are parked, not cancelled. Second purpose (quietly the bigger one): the engines are the **art bible for UE** — their palettes, breathing rhythms, geometry *are* what نūر looks like. Screenshot them into the reference set before any Unreal work.

## 4. The Oven
Bounded pre-UE finish state: **locked script · storyboards · animatic with scratch audio · a source dossier — submitted to the marjaʿ.** Nothing renders past the animatic until clearance returns. The dependency is human, not technical; producing before the gate risks burning work we may be asked to change. Animatic + dossier = the maximum responsible investment.

## 5. The Scholar Gate (the real launch blocker)
A **people** task: shortlist 3–5 hawza-trained reviewers, send each the hub link + the review form, follow up on a fixed **two-week cadence**, get **one signed review** of the current content set. Until that signature exists, these stay **parked, no exceptions:** the persecution arc, cross-scripture material, miracle content, any narration beyond the reviewed set. The site may stay quietly live; **promotion waits for the gate.** Honest: this could take months — everything else is designed so waiting costs nothing.

## 6. The Researcher (مراجع) — build the ledger, defer the room
**Build now:** a **sources ledger** — every narration/claim mapped to source, grading, and a reviewer-notes field, surfaced as a simple citations panel per chapter. Cheap in the browser, exactly the instrument a reviewing scholar needs, and it *accelerates the §5 bottleneck.* Ports to UE as pure data.
**Defer:** the full researcher *mode* (search, cross-referencing, filters) — that's a reading room; we only need the ledger. Build the tool the gatekeeper needs, not the one we'd enjoy.

## 7. UE prep — ready before install
- **Reference set** — 15–20 images: PS1-era games (Grandpa High on Retro), real Abbasid Baghdad architecture, āyāt-engine screenshots + a one-page **look bible** (128–256px textures, fog, dither, palette, what نūر light does and never does).
- **Pipeline-test spec (the whole test, nothing more):** one night courtyard (~20×20 m blockout, 3 lights, PS1 post-process); one faceless نūر NPC (idle + walk); one 6–10 line AI-voiced exchange; subtitles with tappable glossary terms. **Success =** 60 fps on the 4060 laptop · a demonstrated MCP round-trip (Claude places an asset + edits a material in-editor) · voice text-to-audio with a light-pulse sync · a packaged build that launches. **Time-box: two weeks.**
- **Machines:** the laptop is the dev box; the ten machines are for later parallel bakes/batch — note specs, set nothing up.
- **Go/no-go (verbatim):** *"If the courtyard and the voiced نūر NPC hit every success criterion within the two-week box, the UE track opens at WIP=1 and the browser freezes to maintenance. If not, UE parks for six months and Arc 2 ships in the browser."* No third outcome.

## 8. Design revisions (Fable, under authority)
1. **Retire "99 levels" as public language.** 99 stays our private horizon; publicly the game has **stations** and **circles**, and *"the path continues."* A number is a promise; a path is an invitation.
2. **Make The Return structural.** It's currently an epilogue; it should be the **closing beat of every circle** — wonder → three method stations → stillness → return. Method that never returns to the street is scholarship; method that does is character. This is the game's meter now.
3. **Give the Mirror memory.** It still never grades — but it should quietly **remember conduct choices** (the rumour restraint, the patience shown) and reflect them back a circle later. A mirror that remembers you is the difference between a feature and a companion. Cheap now, impossible to retrofit later.

Naming stands: **Bayt al-Nūr** is the house; **The Path of Light** is a room in it; the hub makes that hierarchy visible.

## 9. The single next action
**Build the hub page this week — one file, one evening — and the moment it's live, send the first scholar-review request.** Everything else lands on that page, and the longest pole in the project starts moving the day that email goes out.
