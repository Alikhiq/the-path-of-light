# The Path of Light — Roadmap

> Scope guardrails for everything below: the game teaches the **method** of verifying reports — it never grades a real hadith or issues rulings. **Never depict the Maʿṣūmīn (Allah, the Prophet ﷺ, Fatima, the Imams) or any sacred figure** — in the UE5 track they appear as *light only* (no face, no body); the shipped **browser** game shows **no faces at all** (calligraphy / silhouette). The UE5 track *does* show ordinary people (narrators, citizens) with real faces + an aura system. All in-game religious text is placeholder **(to be written + verified by qualified Twelver Shia scholars)**.

---

## 1. Future chapter concepts

Fictional puzzles, one distinct verification skill each. All follow the existing chapter shape (`intro → investigate 3 clues → resolve`, difficulty-scaled, decoys on hard).

| # | Chapter | Skill taught |
|---|---------|--------------|
| 4 | The Hundred Witnesses | Tawatur vs khabar wahid |
| 5 | Weighed Against the Book | Matn vs Qur'an contradiction |
| 6 | The Hidden Teacher | Tadlis (concealed transmission) |
| 7 | Two True-Sounding Reports | Resolving conflicting reports |
| 8 | The Scribe's Slip | Manuscript & edition awareness |
| 9 | The Storyteller's Square | Attribution drift & fabricator motive |
| 10 | Words Torn from Their Day | Context of utterance |
| 11 | The Weight of an Accusation | Epistemic humility & burden of proof |

**Ch 4 — The Hundred Witnesses** · *Tawatur vs khabar wahid.*
News of a fire at the granary arrives from dozens of unconnected travelers; news of buried treasure arrives from one eloquent stranger. The player learns why mass independent transmission carries a different weight than a single report — and why "many repeaters" is not the same as "many independent sources" (one bazaar rumor copied a hundred times is still one source).
*Setting:* the caravanserai at the city gate, arrival ledgers and route maps as clues.

**Ch 5 — Weighed Against the Book** · *Matn-vs-Qur'an contradiction.*
A report with a clean-looking chain urges something that flatly contradicts a (placeholder) established principle. The player learns that a sound-seeming sanad does not rescue a matn that collides with stronger evidence — content is examined, not just carriers.
*Setting:* the mosque library annex; clues are a comparison desk, a marginal gloss, a decoy "beautiful calligraphy" trap.

**Ch 6 — The Hidden Teacher** · *Tadlis / concealment.*
A narrator says "from so-and-so" without ever saying "he told me." The player discovers the narrator skipped a person entirely and learns why vague linking words matter, and why scholars scrutinized *how* transmission is claimed, not just *who* claims it.
*Setting:* the paper-makers' quarter at dusk; clues are two versions of the same chain, a travel record, an apprentice's account.

**Ch 7 — Two True-Sounding Reports** · *Resolving conflicting reports.*
Two reports, each with a defensible chain, give opposite guidance about a fictional civic matter (a well's water rights). The player walks the resolution ladder: can they be reconciled? Is one better attested? If neither — the honest answer is suspension, not a coin flip.
*Setting:* the judge's diwan; clues are the two scrolls, a reconciling witness, a dated context note.

**Ch 8 — The Scribe's Slip** · *Manuscript and edition awareness.*
Three copies of one text disagree by a single dotted letter that flips the meaning. The player collates copies, finds the oldest reliable exemplar, and learns that "the book says" always means "*this copy* of the book says."
*Setting:* the scriptorium and bindery; clues are the three folios, a copyist's colophon, an erasure under lamplight.

**Ch 9 — The Storyteller's Square** · *Attribution drift and fabricator motive.*
A modest local proverb is retold nightly by a crowd-pleasing storyteller, and each week it climbs to a more famous mouth. The player traces the drift and catalogs *why* fabrication happens — applause, money, faction — without ever accusing a named historical person.
*Setting:* the public square at night; clues are three dated retellings of the same tale, each grander than the last.

**Ch 10 — Words Torn from Their Day** · *Context of utterance.*
A genuine (fictional) saying is being quoted to justify something its original occasion never addressed. The player reconstructs when and why the words were said, and learns that a true report can still be misused — verification includes context, not just origin.
*Setting:* a pilgrim caravan's return camp; clues are a travel diary, the full letter the quote was cut from, a witness to the occasion.

**Ch 11 — The Weight of an Accusation** · *Epistemic humility and burden of proof.*
The player has caught fabrications in prior chapters — now a crowd wants them to brand a living copyist a liar on thin evidence. The capstone: "unknown" is not "dishonest," "unproven" is not "false," and the method's final discipline is saying exactly as much as the evidence allows, then referring upward to qualified scholars.
*Setting:* the House of Wisdom courtyard, full circle from Chapter 1.

---

## 2. Feature backlog

Ranked. Excludes the current world-pass (clue props, per-chapter districts, ambient audio, dialogue juice).

| Rank | Feature | What it is | Why this rank |
|------|---------|------------|---------------|
| 1 | **Interactive sanad diagram** | A tappable chain visualization in the casebook: nodes = narrators (silhouette/seal icons, no faces), edges = claimed transmission. Nodes light up as clues are found; the weak link pulses. Ch 3's timeline overlays death dates onto the edges. | It *is* the mental model the game teaches; already earmarked (explicitly out of GPT's scope, owned here). |
| 2 | **Casebook 2.0 + living glossary** | Terms (sanad, matn, thiqa, dabit, majhul, ittisal, wad'…) become tappable in dialogue; each unlocks a plain-language glossary card with the chapter where it was learned. Casebook keeps per-chapter evidence summaries the player can re-read. | Retention: the vocabulary is the curriculum; currently it scrolls past once. |
| 3 | **Replay-for-mastery** | Completed chapters replay at a higher difficulty tier (easy→mid→hard uses the existing per-chapter difficulty scaling), with shuffled clue positions and a fresh decoy. Clean no-hint run earns a mastery seal. | Cheap (content.js already encodes 3 tiers of the same story); turns 3 chapters into 9 sessions. |
| 4 | **Progress & badges** | Per-*skill* badges ("Reads the Chain," "Weighs the Wording," "Keeper of Dates"), a hub progress lantern that brightens per chapter, mastery seals from replays. Local-first (localStorage), no accounts, no leaderboards (avoids competitive grading of religious learning). | Motivation for the younger band with minimal backend. |
| 5 | **Tiered hint system** | The lantern guide becomes a real system: hint 1 = which district zone, hint 2 = the clue's `hint` text, hint 3 = marker glow. Free on easy; small Trust cost on mid/hard (consistent with existing guessing costs). | Removes the stuck-player drop-off without flattening hard mode. |
| 6 | **Content pipeline & scholar-review lint** | A script that walks `content.js` and reports: placeholder religious text not yet marked "(to be written + verified…)", guardrail strings missing, choice `to:` targets dangling, clue keys unreferenced. Runs pre-commit. | The whole project's credibility rests on nothing unverified shipping; make the guardrail mechanical. |
| 7 | **Wrong-answer teachback** | On a wrong choice, a one-line "why" card (already half-present as toasts) expands into an optional 2-sentence explanation in the casebook, so mistakes teach instead of just costing Trust. | Highest learning value per line of content written. |
| 8 | **Learner profiles / save slots** | 2–3 named local profiles per device (siblings share tablets). Profile = save + badges + glossary state. | Real usage pattern for the 7–12 band; pure localStorage work. |
| 9 | **End-of-chapter case summary export** | "Seal the casebook" optionally renders a printable one-page case summary (evidence found, judgement, terms learned). | Bridges to classroom mode (Section 3) cheaply. |
| 10 | **Performance & device QA pass** | Draw-call budget enforcement (<150), low-end Android test matrix, optional "lite" render mode (fewer buildings, no particles). | Protects the mobile-first promise as districts and props grow. |

---

## 3. Reach & audience

### Localization — Arabic first
- **Restructure `content.js` for locales**: split strings into `content.<locale>.js` tables keyed by chapter/step id; the engine already reads everything from one object, so this is mostly mechanical.
- **Arabic (ar)** first: full RTL layout pass (styles.css is mobile-first but LTR-assumed — audit HUD, dialogue, casebook, joystick side), Arabic typography (a proper Naskh webfont, embedded for offline), and the brand word "نور" becomes native rather than decorative. Arabic terms (sanad, matn, thiqa) shift from transliteration to primary script.
- Then **Farsi and Urdu** (largest Twelver audiences), sharing the RTL work; then French/English refinement. Every localized *religious-adjacent* string goes through the same scholar-verification gate as English — translation is not exempt from the guardrail.

### Classroom / teacher mode
- **Lean into what exists**: `content.js` is explicitly designed for teachers to edit without code — document that path as a first-class feature ("write your own fictional case").
- **Teacher pack per chapter**: discussion questions, the skill's real-world name and where it lives in the tradition (scholar-reviewed), printable casebook pages (backlog #9).
- **Session mode**: a no-save "guest run" for shared school devices; optional class code that only tags suggestion-box submissions (existing Supabase table) — no student accounts, no PII.
- **Projector mode**: larger UI scale + keyboard-only driving so one player can walk while the class debates the choices — the branching dialogue is naturally a group discussion engine.

### Accessibility
- Already respected: `prefers-reduced-motion`. Extend to a full settings panel: **text size**, **high-contrast palette**, **dyslexia-friendly font toggle**, per-channel **audio captions** ("· evidence chime ·").
- **Reader mode (2D fallback)**: the entire chapter loop — dialogue, clue examination, resolution — playable from a flat illustrated map with tap targets. Serves screen-reader users, motion-sensitive players, and very low-end devices with one build; the World API boundary (`load/setFound/setFocus`) makes a swap-in 2D "world" feasible.
- **Screen-reader pass** on all HUD/dialogue DOM (it's plain HTML overlays, so this is achievable): focus order, aria-live for toasts, labeled controls.

### Offline & low-bandwidth
- PWA + network-first SW already exists; add **explicit chapter packs**: precache a chapter's assets on first entry and show an "available offline" mark in the hub.
- **Lite asset tier** (smaller hub images, no ambient audio synthesis on weak devices) selected by connection/device heuristics — matters for the global majority of the target audience on modest Android phones.

### Widening from 7–19
- **Downward (5–7)**: a "listen mode" easy tier — dialogue read aloud (recorded human voice, not depicted characters), two-choice questions, lantern always on. No new content, one more difficulty rung.
- **Upward (adult / seminary-adjacent)**: hard tier gains an optional "deeper" card per source note pointing to real usul al-hadith topics *by name only* (what to ask a teacher about) — never in-game rulings; scholar-reviewed pointers, not citations to gradings.
- **Family co-play**: end-of-chapter "ask each other" prompts (one for the child, one for the parent) printed on the case summary.
- **The bridge audience**: the method — source, chain, timing, motive, context — is general media literacy. A single framing line at the hub ("these questions work on any report you're sent") widens relevance to every teenager with a group chat, without diluting the Islamic setting or purpose.
