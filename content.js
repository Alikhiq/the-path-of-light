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
    image: "assets/city-of-light.png",
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
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "Tap the glowing golden marker to speak with the teacher.",
      clues: [
        { key: "books",   title: "A copied folio", x: 23, y: 71, hint: "Manuscript stall",
          copy: "The margin names a person who passed the saying along — but gives no source for the claim. A useful lead, not proof." },
        { key: "arch",    title: "A maker's mark", x: 75, y: 62, hint: "Courtyard mark",
          copy: "The same carved sign appears along the courier's route. Context can connect pieces of evidence without deciding if the report is true." },
        { key: "pottery", title: "The potter's seal", x: 62, y: 84, hint: "Potter's seal",
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
      guardrail: "A fictional story built around real verification principles. Do not use the game alone to authenticate any report."
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
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "Use Scholar's Focus to reveal each narrator, then judge them.",
      clues: [
        { key: "adil", title: "The upright narrator", x: 20, y: 66, hint: "A known teacher",
          copy: "This narrator is remembered as just ('adil) and careful (dabit) — trustworthy (thiqa). Scholars of narrator-criticism (ilm al-rijal) recorded such judgements." },
        { key: "dabit", title: "The forgetful narrator", x: 52, y: 78, hint: "An anxious merchant",
          copy: "Honest, but known to mix up wording as he aged. Precision (dabt) matters as much as honesty — a weak memory can bend a report." },
        { key: "majhul", title: "The unknown link", x: 79, y: 60, hint: "A missing face",
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
      guardrail: "Narrator judgements here are simplified teaching examples, not verdicts on real historical figures. Real rijal assessment belongs to qualified scholars."
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
      teacher: { name: "Ustadha Maryam", role: "House of Wisdom", portrait: "assets/ustadha-maryam.jpg" },
      guide: "",
      clues: [
        { key: "death", title: "A recorded death", x: 26, y: 63, hint: "A dated register",
          copy: "The register fixes when the earlier narrator died. A transmission claimed after that date, from him directly, cannot stand — the two never met (no ittisal)." },
        { key: "matn", title: "A word out of its time", x: 71, y: 58, hint: "The wording itself",
          copy: "The text (matn) mentions a thing that did not exist in that era — an anachronism. Content, not only chain, can expose a fabrication (wad')." },
        { key: "trap", title: "An impressive endorsement", x: 49, y: 82, hint: "A flattering seal", decoy: true,
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
      guardrail: "A constructed puzzle to teach chronological reasoning. It is not a claim about any specific real narration; grading real reports is the work of qualified scholars."
    }
  ]
};
