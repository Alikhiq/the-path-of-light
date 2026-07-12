# Reviewing The Path of Light — a guide for scholars

Thank you for reviewing this game. This note is for a qualified Twelver Shia scholar checking the content before it's shown more widely — no programming background needed.

## What this game is

The Path of Light is a short, fictional walking game set in old Baghdad. The player explores a street, gathers "evidence" about a saying moving through the market, and talks to a teacher character about it. The three chapters teach, in order: checking where a claim comes from, judging the people who passed it along, and checking whether the timeline is even possible.

**Important:** nothing in the game is a real hadith, and the game never tells the player "this is authentic" or "this is fabricated" about any real report. Every chain, narrator, and report in it is invented for teaching purposes. The one thing we need your judgment on is whether that invented teaching material is *accurate about the method* and *respectful in how it's presented*.

## Where the words live: `content.js`

All of the text you'll review — every line of dialogue, every clue description, every source note — sits in one file: `content.js`. You can open it with any plain text editor (Notepad, TextEdit, VS Code, etc.). It looks like a long list of short labels followed by sentences in quotation marks, for example:

```
title: "The Unbroken Chain",
teaser: "A saying is spreading through the market...",
```

### How to edit it safely

- **Only change the text between the quotation marks** (`"like this"`). That's the actual game text.
- **Never change the word right before the colon** (things like `title:`, `text:`, `label:`, `note:`). Those are labels the game's code looks for by exact name — changing or deleting one will break the game.
- **Leave commas, curly braces `{ }`, and square brackets `[ ]` exactly where they are.** They're just as important as the words, even though they look like punctuation clutter. If you're not sure whether something is "just text" or "structure," don't touch it — leave a note instead (see below) and let a developer make the change.
- **Use a plain text or code editor, not Word or Google Docs.** Word processors often turn straight quotes (`"`) into curly "smart quotes," which will break the file. A code editor (or even Notepad) avoids this automatically.
- After you've made edits, it's good practice (but not something you need to do yourself) to have a developer load the game locally and confirm it still runs before anything is published.

If in doubt at any point: **describe the change in plain language rather than editing the file yourself.** A wrong edit to structure is much harder to undo than a clearly written note.

## What to verify, per claim

Please review each chapter's dialogue, clue text (`copy` fields), and source notes (`sources` section) with these questions in mind:

1. **Citation and edition** — Where the game references a source or collection (even in a general, non-specific way), is that reference honest and something a reader could actually go check? Flag anything that invents a citation or is vague in a misleading way.
2. **Grading method used** — Does the text correctly describe *how* a report would actually be graded (e.g. the meaning of terms like sahih, hasan, muwaththaq, da'if) for a Twelver Shia audience? Flag any term that's used loosely or incorrectly.
3. **School position** — Does the wording reflect a defensible, mainstream Twelver Shia position, rather than quietly presenting one view as if it were the only one?
4. **Points of scholarly disagreement** — Where scholars genuinely disagree (on a narrator's standing, a grading method, or how to weigh chronology), does the game acknowledge that there's disagreement, rather than presenting a single verdict as settled fact?
5. **No sacred figure depicted or quoted as ruling** — Confirm that:
   - No image in the game shows a face representing Allah, a Prophet, an Imam, or Fatima al-Zahra (people should only appear as a plain gold calligraphic seal or a featureless robed silhouette with no facial features).
   - No line of dialogue puts invented words directly into the mouth of an Imam or other sacred figure as though it were an authentic saying.
   - The only named "teacher" character in the game (a fictional narrator, not a historical or sacred figure) is clearly presented as fictional, not as a religious authority.
6. **Tone and humility** — Confirm the game consistently defers to real scholarship (phrases like "consult qualified scholars," not verdicts stated as fact) and never implies the game itself is sufficient to authenticate anything.

A quick way to work: read one chapter's `intro`, `clues`, `resolve`, and `sources` text together (they're grouped in `content.js` under that chapter's block), then note any concern against the checklist above before moving to the next chapter. The companion file [`scholar-review.md`](scholar-review.md) already lists every claim in a table with a sign-off column — you can review straight down it.

## How to return feedback

- **Quick notes:** the game itself has a "Suggest an idea" button (pencil icon) on the hub screen and in every chapter. Anything typed there is saved and reviewed by the team — this is the fastest way to flag something in the moment.
- **Detailed or chapter-specific concerns:** please write a short note per issue, in this shape:
  - **Chapter:** (e.g. "Chapter 2 — Names in the Chain")
  - **Where:** (e.g. "the resolve dialogue" or "the second source note")
  - **Concern:** what's inaccurate, imprecise, or presented as more settled than it is
  - **Suggested wording (optional):** if you already have language you'd prefer
- Send these notes back to the project maintainer however you normally coordinate with them (email, message, or a written document is fine). You do not need to edit the file yourself unless you want to and are comfortable doing so — a plain-language note is just as useful and lower-risk.

Thank you again for taking the time to review this. Nothing here is meant to go live to a wider audience until you're comfortable with it.
