# Bayt al-Nūr — Where We Are, and the Real Plan

*Owner asked for the honest picture: what's been requested, what's actually built, the big steps, the big decisions. This is that — plainly, no spin.*

---

## The honest reality check (read this first)

You said: *"end-to-end game design is possible through Claude, it's very easy, hundreds of people are doing it, ending up with games almost like GTA first version."*

Here is the true version of that, because you deserve it straight:

- **The easy, real part is true.** People (and you, now) ship real, playable games with AI help. **You already have one live** — "The Path of Light" is a finished, deployed, walkable browser game. That's not a demo. That's shipped.
- **The "almost like GTA" part is not true on the timeline you're picturing.** GTA III was ~100 people over ~3 years. No single person + AI + one laptop makes that in weeks. Anyone claiming otherwise is selling a highlight reel, not the 3 years behind it.
- **What one person + AI + your 4060 laptop *can* make, and be genuinely proud of:** a **small, beautiful, focused 3D experience** — one lamplit night-Baghdad courtyard you walk through, a voiced teacher character, the aura system glowing on people, one chapter playable in 3D. That is a real "vertical slice." It's achievable, it's gorgeous if scoped tight, and it's the honest target.
- **You did nothing wrong.** Your instructions weren't "too simple" — you correctly pointed at real capabilities. The only correction is *scale expectation*: think "one stunning room," not "a whole open city," for v1. Rooms are how big games get built anyway.

Nothing you've asked for is wasted. The tech carries. Here's the map.

---

## What is actually built (green = done and real)

| Thing | Status |
|-------|--------|
| **"The Path of Light" browser game** — 3 chapters, walkable first-person, Circle of Stillness, casebook, glossary, sanad diagram, ambience | 🟢 **Shipped & live** at alikhiq.github.io/the-path-of-light |
| **Suggestion box** (Supabase `altasleem`) | 🟢 Live |
| **UE5.8 + AI-agent editor pipeline (MCP)** — an AI drives the Unreal editor with no GUI: built a greybox courtyard, a voiced NPC via Blueprint, materials, ran it in-editor | 🟢 **Proven end-to-end** |
| **Art direction** — real ordinary faces + 5-tier aura system; sacred = light only | 🟢 Locked |
| **v1 look spec** — "Lamplight Realism" tuned to the 4060, adversarially verified | 🟢 Written (`docs/lamplight-realism-4060-build-spec.md`) |
| **The plan docs reconciled** — all old PS1/faceless directions retired to one canon | 🟢 Done |

## What is NOT built yet (the honest gaps)

| Thing | Status |
|-------|--------|
| **UE vertical slice** — one Lamplight courtyard + voiced NPC + aura, actually built in the new look | 🔴 Not started (spec is ready; this is the next real build) |
| **The Hub** — Bayt al-Nūr web home (one page, five doors) | 🔴 Not built (one evening's work) |
| **Scholar sign-off** — the real launch blocker | 🔴 Not started (a *people* task, longest pole) |
| **Cinematics** (trailer / sacred beats via Gemini/Higgsfield) | 🔴 Not started |

---

## The big steps (the path, in order)

1. **Harden the shipped browser game** — QA pass, accessibility, the sources ledger. It's your live product; keep it solid.
2. **Build the Hub** (one static page, one evening) — the single front door everything hangs off. *This unlocks step 3.*
3. **Start the scholar gate** — shortlist 3–5 hawza-trained reviewers, send the Hub + review form, follow up every 2 weeks. **This is the longest pole — start it the day the Hub is live.** Everything else is designed so waiting on this costs nothing.
4. **Build the UE vertical slice** — one Lamplight courtyard, one voiced NPC, the aura system, one chapter in 3D, per `lamplight-realism-4060-build-spec.md`. Driven by the terminal Claude (the sole editor agent); you do binary imports + level saves.
5. **Cinematics lane** — Gemini stills for key art, Higgsfield/Veo for a trailer + the sacred "light" beats. Capped by nothing (not your GPU) — max it separately.
6. **(New, separate) Kids animation channel** — "Nūr Stories" — its own repo + handoff (`C:\ProjectX\nur-kids-stories\HANDOFF.md`). Fully code/API automatable.

---

## The big 10 decisions (locked — this is the canon)

1. **Ship browser first, UE as the upgrade lane** — not either/or. The web game is v1; UE is the graphics tier on top.
2. **v1 UE look = "Lamplight Realism" on the 4060** — grounded night realism ~30fps; **no ray-tracing / Nanite / Lumen at runtime** (baked lighting instead).
3. **Real, visible ordinary human characters** (narrators, scholars, citizens) — with faces.
4. **Moral state shown by a 5-tier aura** ("lamp rig"): reserved An-Nūr → steady flame (righteous) → clear night (neutral) → guttering (weak) → hollow lamp (corrupt).
5. **The 14 Maʿṣūmīn + Allah + angels = LIGHT ONLY, never a face or body** — enforced as engine settings (no head geometry, no shadow, camera kept back). Same rule in every lane: game, cinematics, kids channel.
6. **Auras never grade real historical hadith narrators** — real persons locked to neutral, no "blessed/damned" over anyone real.
7. **Teaches the *method* of verifying reports — never grades a real hadith, never issues a ruling.** All in-game religious text is placeholder until scholar-written + verified.
8. **Qualified Twelver scholar sign-off before any public promotion.** Site may sit quietly live; promotion waits for the signature.
9. **One AI agent drives the UE editor at a time** (16GB RAM ceiling) — the terminal Claude is the sole editor driver; the owner does binary asset imports + Ctrl+S saves (the one wall MCP can't cross).
10. **Two capped lanes:** the *playable game* is capped by the player's GPU; *AI stills + offline-farm cinematics* are capped by nothing → push each to its own ceiling. Public language is **"stations & circles,"** not "99 levels."

---

## The single next action

**Build the Hub page this week — one file, one evening — and the moment it's live, send the first scholar-review request.** That starts the longest pole moving. The UE vertical slice and the cinematics can proceed in parallel behind it; the scholar signature is what gates *promotion*, not *building*.

---

## The whole family, one sentence each (so it's not scattered in your head)

- **The Path of Light** — the game (browser now, UE upgrade coming). 🟢 live.
- **Bayt al-Nūr Hub** — the one web home tying it together. 🔴 next.
- **The Āyāt engines** — ~14 built; freeze and curate as the art bible + a gallery.
- **The Oven** — a cinematic, parked at "animatic + dossier" until scholar clearance.
- **Nūr Stories** — the new kids' animation YouTube channel. 🆕 separate repo, ready to start.

One house. One light. `WIP = 1` — finish the Hub, start the scholar clock, then the slice.
