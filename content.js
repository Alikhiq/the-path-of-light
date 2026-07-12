/*
  The Path of Light — GAME CONTENT
  ---------------------------------
  This is the file a teacher or scholar edits. No coding needed.
  Change the words in quotes. Keep the structure (the keys like `title:` and the commas).

  Difficulty scales the SAME story:
    easy = age ~7   : lantern guide on, clues glow, wrong answers never punish, simple words
    mid  = older    : clues hidden until Focus, small Trust cost for guessing
    hard = expert   : clues hidden, a decoy trap, real technical terms, no hints

  GUARDRAIL: the game teaches the METHOD of checking a report. It never grades a real
  hadith or issues a ruling. Production content must be reviewed by qualified Twelver
  Shia scholars (identify school, edition, grading method, and scholarly disagreement).
*/
window.CONTENT = {
  version: 1,
  brandWord: "نور",
  hub: {
    title: "The Path of Light",
    subtitle: "Choose a chapter",
    image: "assets/city-of-light.jpg",
    intro: "Baghdad is alive with stories. Some are true. Some only sound true. Walk the city and learn how careful people tell the difference — without ever putting words on the Imams that were never theirs."
  },

  chapters: [
    /* ---------------------------------------------------------------- CH 1 */
    {
      id: "verify",
      order: 1,
      difficulty: "easy",
      badge: "Sequence 01",
      place: "House of Wisdom",
      era: "Baghdad · 250 AH",
      title: "The Unbroken Chain",
      teaser: "A saying is spreading through the market. Before it shapes people, find out where it came from — and whether it can be trusted.",
      objective: "Find the keeper of the manuscript",
      image: "assets/baghdad-street.png",
      tint: "warm",
      landmark: "library",
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "Tap the glowing golden marker to speak with the teacher.",
      clues: [
        { key: "books",   title: "A copied folio", x: 23, y: 71, hint: "Manuscript stall", prop: "stall",
          copy: "The margin names a person who passed the saying along — but gives no source for the claim. A useful lead, not proof." },
        { key: "arch",    title: "A maker's mark", x: 75, y: 62, hint: "Courtyard mark", prop: "stele",
          copy: "The same carved sign appears along the courier's route. Context can connect pieces of evidence without deciding if the report is true." },
        { key: "pottery", title: "The potter's seal", x: 62, y: 84, hint: "Potter's seal", prop: "pots",
          copy: "A date on the seal places the object after one named person had already died. Time can quietly expose a broken link." }
      ],
      intro: [
        { text: "You came for the saying carried through the market. Tell me — if the words sound wise, is that enough to attribute them to Imam al-Sadiq?",
          choices: [
            { label: "Yes — good words prove who said them.", to: 0, insight: 0, trust: -1, toast: "A beautiful meaning can still be placed on the wrong name." },
            { label: "No. We should trace its source and its chain.", to: 1, insight: 20, trust: 1, toast: "Insight +20 · Trust +1" },
            { label: "If many people repeat it, it becomes true.", to: 0, insight: 0, trust: -1, toast: "Repeating a thing does not make it a source." }
          ] },
        { text: "Good. A lovely meaning may still be misattributed. Examine the stall, the courtyard mark, and the potter's seal. Each teaches a different part of checking a report.",
          choices: [ { label: "I will look before I judge.", to: "investigate" } ] }
      ],
      resolve: [
        { text: "You found the pieces. The folio names someone in the chain, the seal tests the timing, and the route gives context. What should we do now?",
          choices: [
            { label: "Declare the report true ourselves.", to: 0, insight: 0, trust: -1, toast: "A learner records evidence; a scholar weighs it." },
            { label: "Record the evidence and consult qualified scholars.", to: 1, insight: 40, trust: 1, toast: "Case resolved · Insight +40 · Trust +1" },
            { label: "Throw out every version of the report.", to: 0, insight: 0, trust: -1, toast: "Discarding blindly is not checking either." }
          ] },
        { text: "That is the discipline of knowledge: check carefully, name what is uncertain honestly, and never place words on the Imams without evidence.",
          choices: [ { label: "Close the casebook.", to: "complete" } ] }
      ],
      sources: [
        { label: "Chain and text", note: "Scholars study both the chain of transmission (sanad) and the wording (matn) of a report." },
        { label: "Qur'anic foundation", note: "Qur'an 49:6 (al-Hujurat) is commonly discussed as a basis for carefully verifying consequential reports before acting on them." },
        { label: "Why al-Sadiq", note: "Most narrations of the Ahl al-Bayt in Twelver collections are reported from Imam Ja'far al-Sadiq (d. 148 AH), which is why careful attribution to him matters." }
      ],
      guardrail: "A fictional story built around real verification principles. Do not use the game alone to authenticate any report.",
      chain: {
        heading: "The chain as the market tells it. Tap each seal to weigh the link.",
        nodes: [
          { id: "origin",  label: "The reported origin",         trait: "Where the report claims to begin. Recorded as a seal — never depicted, never named as a sacred figure." },
          { id: "named",   label: "The named carrier",  clue: "books",   trait: "A margin names him, but records no source for what he passed along." },
          { id: "courier", label: "The courier of the east road", clue: "arch", trait: "A maker's mark ties him to the route — context that connects the pieces without deciding the truth." },
          { id: "voice",   label: "The market voice",   clue: "pottery", trait: "A dated seal places the object in time, where the report reaches the street." },
          { id: "you",     label: "Your casebook",              trait: "Where the report arrives — and where it waits for qualified scholars to weigh it." }
        ],
        weak: 1,
        why: "The margin names this carrier but gives no source for the claim. A name without a traceable source is a useful lead, not proof — on this link the chain cannot yet be relied upon.",
        lockedWhy: "Something about this link is undecided. Examine the street first — the evidence explains it."
      }
    },

    /* ---------------------------------------------------------------- CH 2 */
    {
      id: "chains",
      order: 2,
      difficulty: "mid",
      badge: "Sequence 02",
      place: "The narrators' court",
      era: "Baghdad · 250 AH",
      title: "Names in the Chain",
      teaser: "Every report is carried by people. A chain is only as strong as each person in it. Learn to weigh the narrators.",
      objective: "Weigh each name in the chain",
      image: "assets/baghdad-street.png",
      tint: "neutral",
      landmark: "court",
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "Use Scholar's Focus to reveal each narrator, then judge them.",
      clues: [
        { key: "adil", title: "The upright narrator", x: 20, y: 66, hint: "A known teacher", prop: "lectern",
          copy: "This narrator is remembered as just ('adil) and careful (dabit) — trustworthy (thiqa). Scholars of narrator-criticism (ilm al-rijal) recorded such judgements." },
        { key: "dabit", title: "The forgetful narrator", x: 52, y: 78, hint: "An anxious merchant", prop: "stall",
          copy: "Honest, but known to mix up wording as he aged. Precision (dabt) matters as much as honesty — a weak memory can bend a report." },
        { key: "majhul", title: "The unknown link", x: 79, y: 60, hint: "A missing face", prop: "figure",
          copy: "No one recorded who this person was (majhul — unknown). An unknown link means the chain cannot be relied upon, however fine the rest." }
      ],
      intro: [
        { text: "A report reaches us through three narrators. Two are named in the books; one, no one can place. Which narrator decides the strength of the whole chain?",
          choices: [
            { label: "The most famous one.", to: 0, insight: 0, trust: -1, toast: "Fame is not the measure here." },
            { label: "The weakest link in it.", to: 1, insight: 25, trust: 1, toast: "Insight +25 · Trust +1 — a chain breaks at its weakest link." },
            { label: "The first one to tell it.", to: 0, insight: 0, trust: -1, toast: "Order alone does not make a link sound." }
          ] },
        { text: "Just so. Go and weigh each narrator: is each one honest, precise, and actually known? Find all three before you decide.",
          choices: [ { label: "I will examine each name.", to: "investigate" } ] }
      ],
      resolve: [
        { text: "You have met the three. One is upright and precise, one is honest but forgetful, and one cannot be identified at all. What is your judgement of the chain?",
          choices: [
            { label: "Sound — two of three are fine.", to: 0, insight: 0, trust: -1, toast: "A single unknown link is enough to withhold reliance." },
            { label: "We cannot rely on it — the unknown link blocks it.", to: 1, insight: 45, trust: 1, toast: "Insight +45 · Trust +1" },
            { label: "Reject the narrators as liars.", to: 0, insight: 0, trust: -1, toast: "Unknown is not the same as dishonest — name it precisely." }
          ] },
        { text: "Careful. We do not call people liars without proof, and we do not lean on a chain we cannot trace. We say plainly: its reliability is not established.",
          choices: [ { label: "Record the judgement.", to: "complete" } ] }
      ],
      sources: [
        { label: "Narrator-criticism (rijal)", note: "The science of ilm al-rijal studies each narrator: are they just ('adil), precise (dabit), trustworthy (thiqa)?" },
        { label: "Grading rests on the chain", note: "Twelver grades such as sahih, hasan, and muwaththaq depend on the standing of the narrators in the chain." },
        { label: "Unknown ≠ dishonest", note: "A narrator who cannot be identified is majhul (unknown); this weakens reliance without accusing anyone of lying." }
      ],
      guardrail: "Narrator judgements here are simplified teaching examples, not verdicts on real historical figures. Real rijal assessment belongs to qualified scholars.",
      chain: {
        heading: "The chain as the market tells it. Tap each seal to weigh the link.",
        nodes: [
          { id: "origin",   label: "The reported origin",    trait: "Where the report claims to begin. Recorded as a seal — never depicted." },
          { id: "upright",  label: "The upright teacher",  clue: "adil",   trait: "Remembered as just ('adil) and precise (dabit) — trustworthy (thiqa)." },
          { id: "merchant", label: "The honest merchant", clue: "dabit",  trait: "Honest, but known to mix wording with age. Precision matters as much as honesty." },
          { id: "unnamed",  label: "The unnamed carrier", clue: "majhul", trait: "No book records who this was." },
          { id: "you",      label: "Your casebook",          trait: "Where the report arrives — and where it waits for qualified scholars." }
        ],
        weak: 3,
        why: "An unknown link means the whole chain cannot be relied upon, however fine the rest. We do not call the unknown a liar — we say plainly: its reliability is not established.",
        lockedWhy: "Something about this link is undecided. Examine the street first — the evidence explains it."
      }
    },

    /* ---------------------------------------------------------------- CH 3 */
    {
      id: "chronology",
      order: 3,
      difficulty: "hard",
      badge: "Sequence 03",
      place: "The hall of dates",
      era: "Baghdad · 250 AH",
      title: "Broken by Time",
      teaser: "A chain can name only trustworthy people and still be impossible. When two narrators never shared a lifetime, the report cannot have passed between them.",
      objective: "Find the link time makes impossible",
      image: "assets/baghdad-street.png",
      tint: "cool",
      landmark: "observatory",
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "",
      clues: [
        { key: "death", title: "A recorded death", x: 26, y: 63, hint: "A dated register", prop: "stele",
          copy: "The register fixes when the earlier narrator died. A transmission claimed after that date, from him directly, cannot stand — the two never met (no ittisal)." },
        { key: "matn", title: "A word out of its time", x: 71, y: 58, hint: "The wording itself", prop: "lectern",
          copy: "The text (matn) mentions a thing that did not exist in that era — an anachronism. Content, not only chain, can expose a fabrication (wad')." },
        { key: "trap", title: "An impressive endorsement", x: 49, y: 82, hint: "A flattering seal", prop: "pots", decoy: true,
          copy: "A grand seal praising the report. Impressive — and irrelevant. Endorsement is not evidence; recording it as proof weakens your case." }
      ],
      intro: [
        { text: "This chain names only respected people. Yet I suspect it is impossible. Where will you look for the break?",
          choices: [
            { label: "The reputations of the narrators.", to: 0, insight: 0, trust: -2, toast: "Good names cannot fix an impossible timeline." },
            { label: "The dates — did these people overlap in life?", to: 1, insight: 30, trust: 1, toast: "Insight +30 · Trust +1" },
            { label: "How beautiful the wording is.", to: 0, insight: 0, trust: -2, toast: "Beauty of wording proves nothing about origin." }
          ] },
        { text: "Then hunt carefully. Not everything that glitters is evidence. Find what the dates and the wording reveal — and do not be flattered by a seal.",
          choices: [ { label: "I will follow the evidence only.", to: "investigate" } ] }
      ],
      resolve: [
        { text: "You have the register and the wording. The earlier narrator died before the later one was active, and the text names a thing out of its time. Your verdict?",
          choices: [
            { label: "The chain is impossible; the report is fabricated.", to: 1, insight: 60, trust: 2, toast: "Case broken · Insight +60 · Trust +2" },
            { label: "Uncertain — the narrators are respected.", to: 0, insight: 0, trust: -1, toast: "Respect does not undo an impossible timeline." },
            { label: "Sound — the endorsement seal vouches for it.", to: 0, insight: 0, trust: -2, toast: "The seal was the decoy. Endorsement is not evidence." }
          ] },
        { text: "That is mastery: when time itself forbids a meeting, no reputation and no seal can rescue the chain. You named the fabrication, and named it with evidence.",
          choices: [ { label: "Seal the casebook.", to: "complete" } ] }
      ],
      sources: [
        { label: "Connection in time (ittisal)", note: "A sound chain requires that each narrator could actually have received the report from the one before — overlapping lifetimes and meeting." },
        { label: "The text can betray a forgery", note: "Analysis of the matn (wording) — anachronisms or contradictions with the Qur'an and stronger evidence — can expose fabrication (wad')." },
        { label: "Endorsement is not proof", note: "Praise, popularity, or an impressive seal never substitute for a traceable, possible chain and sound content." }
      ],
      guardrail: "A constructed puzzle to teach chronological reasoning. It is not a claim about any specific real narration; grading real reports is the work of qualified scholars.",
      chain: {
        heading: "The chain as the register tells it. The wording (matn) is weighed apart from the chain — tap each seal to test a link.",
        nodes: [
          { id: "origin",   label: "The reported origin", trait: "Where the report claims to begin. Recorded as a seal — never depicted." },
          { id: "elder",    label: "The elder scribe",  clue: "death", trait: "A dated register fixes when this earlier narrator died." },
          { id: "claimant", label: "The later claimant",         trait: "Claims to have heard the elder directly — but the dates must allow it." },
          { id: "hall",     label: "The hall of dates",         trait: "Where lifetimes are compared and a meeting is either possible or not." }
        ],
        weak: 2,
        weakRequires: "death",
        broken: 1,
        why: "The register fixes when the elder died. If the later one claims to have heard him directly after that date, the two never met — there is no connection (ittisal), so the link cannot stand however respected the names.",
        lockedWhy: "Something about this link is undecided. Examine the register in the street first — the dates explain it."
      }
    }
  ],

  /* ---------------------------------------------------------------- GLOSSARY
     ADDITIVE ONLY. Plain-language starter definitions. game.js turns known
     transliterated terms in dialogue and casebook records into tappable links
     at render time — it never edits the stored educational text above. */
  glossary: {
    sanad:   { term: "Sanad",   arabic: "سند",   short: "The chain of tellers",
      def: "The list of people a report passed through, one to the next, until it reached the books. Careful checkers read every name on that list.",
      aliases: ["sanad"] },
    matn:    { term: "Matn",    arabic: "متن",   short: "The words of the report",
      def: "What the report actually says. Even when the chain looks fine, the words themselves can be tested against time, sense, and stronger evidence.",
      aliases: ["matn"] },
    thiqa:   { term: "Thiqa",   arabic: "ثقة",   short: "Trustworthy",
      def: "Said of a narrator who is both honest and careful with words. It takes both — a kind person with a fuzzy memory is not enough.",
      aliases: ["thiqa"] },
    dabit:   { term: "Dabit",   arabic: "ضابط",  short: "Precise memory",
      def: "A narrator who keeps a report's wording exactly right, year after year, without mixing it up. Care with memory matters as much as honesty.",
      aliases: ["dabit", "dabt"] },
    majhul:  { term: "Majhul",  arabic: "مجهول", short: "Unknown",
      def: "A name in the chain that nobody can identify. Unknown does not mean dishonest — it means we cannot lean on a link we cannot see.",
      aliases: ["majhul"] },
    ittisal: { term: "Ittisal", arabic: "اتصال", short: "A connected chain",
      def: "Every teller really could have met the one before — their lifetimes and places overlapped. If two people never met, the chain is broken.",
      aliases: ["ittisal"] },
    wad:     { term: "Wad'",    arabic: "وضع",   short: "Fabrication",
      def: "Making a saying up and pinning it on someone who never said it. The heaviest fault a report can have — and the one this game teaches you to spot.",
      aliases: ["wad'", "wad’"] },
    thabit:  { term: "Thabit",  arabic: "ثابت",  short: "Established",
      def: "Firmly standing. A report checked so carefully — chain and words together — that scholars count it as reliable.",
      aliases: ["thabit"] },
    adil:    { term: "'Adil",   arabic: "عادل",  short: "Upright",
      def: "A narrator known for honest, fair conduct. Uprightness is one half of being trustworthy; precise memory is the other.",
      aliases: ["'adil", "‘adil"] },
    rijal:   { term: "Ilm al-rijal", arabic: "علم الرجال", short: "The science of narrators",
      def: "The books scholars wrote about the people in the chains — who each narrator was and how reliable. It is how we know a name is upright, forgetful, or unknown.",
      aliases: ["ilm al-rijal", "rijal"] }
  },
  glossaryNote: "Plain-language starter definitions to help you follow the story. Full technical meanings, and any judgement about real reports, belong to qualified scholars.",

  /* ---------------------------------------------------------------- HALAQA
     The Circle of Stillness — the third beat of the path (spectacle, method,
     STILLNESS). A place, not a level. Entering gives no points; the reward is
     the quiet. Ambient lines are gentle wisdom, never rulings. Edit freely. */
  halaqa: {
    title: "The Circle of Stillness",
    place: "A lamplit courtyard",
    invite: "A ring of light sits in the quiet. Walk in and sit, or simply stand and be.",
    ambient: [
      { who: "A seeker", line: "I came with a hundred questions. I am learning to sit with one." },
      { who: "An elder of the circle", line: "The one who checks a report twice has already begun to guard his tongue." },
      { who: "A young voice", line: "Is it enough, just to be quiet?" },
      { who: "The teacher", line: "Stillness is where knowledge settles. Hurry only spills it." },
      { who: "A traveller", line: "In the market I wanted to be heard. Here I am learning to listen." }
    ],
    intentions: [
      "To seek knowledge for its own sake",
      "To be gentle with what I do not yet know",
      "To slow down before I speak"
    ],
    intentionAck: "The circle holds your intention in the quiet. Nothing here is scored — only Allah knows the hearts."
  },

  /* The Mirror — reflects how you have PLAYED (care, patience, presence). It
     never grades your soul. The note below is permanent and non-negotiable. */
  mirror: {
    title: "The Mirror",
    note: "This reflects your play, not your nafs — only Allah knows the hearts.",
    intro: "A quiet reflection of how you have walked — not a measure of your soul."
  },

  /* ---------------------------------------------------------------- ENCOUNTER
     "The Return" — method + stillness carried into the street as CONDUCT. A
     neighbour brings a rumour; rushing to believe OR to deny are both haste.
     The restraint the game already teaches — "its reliability is not
     established" — is the true answer. No rulings; pure conduct. Edit freely. */
  encounter: {
    title: "A Rumour in the Street",
    speaker: { name: "A neighbour", role: "The street, at dusk" },
    note: "Method and stillness, carried into the street: to say exactly as much as the evidence allows — and no more.",
    steps: [
      { text: "Peace be upon you. They are saying in the market that a certain saying comes from a great teacher — everyone repeats it, so it must be sound. You have studied these things. Is it true?",
        choices: [
          { label: "If everyone repeats it, it must be true.", to: 1, toast: "Repeating a thing does not make it a source." },
          { label: "It is false — pay it no mind.", to: 2, toast: "We do not declare a report false without proof either." },
          { label: "Its reliability is not established — I would trace its chain first.", to: 3 }
        ] },
      { text: "So many mouths, though… yet you hesitate. Tell me plainly, then — how would a careful person answer?",
        choices: [ { label: "Its reliability is not established, until we trace it.", to: 3 } ] },
      { text: "You are quick to throw it away. But is that not the same haste, only turned around?",
        choices: [ { label: "You are right. Its reliability is not established — no more, no less.", to: 3 } ] },
      { text: "…You did not rush to believe, nor to deny. You weighed it, and you were honest about what you do not yet know. That restraint is the harder road — and the truer one. Peace be with you, friend.",
        choices: [ { label: "Walk on.", to: "close" } ] }
    ]
  }
};
