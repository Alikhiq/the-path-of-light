/*
  The Path of Light — game logic. Drives the 3D walkable World (world.js) and
  all the UI: hub, branching dialogue, investigation, casebook, save, suggestions.
  Story content lives in content.js. This file rarely needs editing to change the story.
*/
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = window.CONTENT;

  const SAVE_KEY = "pol-save-v1";
  const SUGGEST_KEY = "pol-suggestions-v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } };
  const saved = load();

  const state = {
    insight: Number.isFinite(saved.insight) ? saved.insight : 0,
    trust: Number.isFinite(saved.trust) ? saved.trust : 0,
    completed: new Set(saved.completed || []),
    mirror: Object.assign({ care: 0, read: 0, skip: 0, presenceSec: 0 }, saved.mirror || {}),
    chapter: null, phase: "intro", dialogue: [], step: 0, found: new Set(), focus: false,
    inHalaqa: false, seated: false, sitStart: 0
  };

  const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify({
    insight: state.insight, trust: state.trust, completed: [...state.completed], mirror: state.mirror
  }));

  function toast(t) {
    const el = $("#toast"); el.textContent = t; el.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function reward(insight = 0, trust = 0) {
    if (insight) state.insight += insight;
    if (trust < 0 && state.chapter && state.chapter.difficulty === "easy") trust = 0;
    state.trust = Math.max(0, state.trust + trust);
    syncHud(); save();
  }

  const requiredClues = ch => ch.clues.filter(c => !c.decoy);

  /* --------------------------------------------------------------- glossary */
  // Build a term index ONCE from C.glossary. If the key is absent the whole
  // feature degrades to a no-op. linkTerms() wraps whole-word transliteration
  // matches in a tappable button at RENDER TIME only — it never rewrites the
  // stored educational text in content.js.
  let TERM_RE = null; const TERM_MAP = {};
  (function buildTerms() {
    const g = C.glossary; if (!g) return;
    const alts = [];
    Object.keys(g).forEach(k => (g[k].aliases || [k]).forEach(a => {
      TERM_MAP[a.toLowerCase()] = k;
      alts.push(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    }));
    alts.sort((a, b) => b.length - a.length); // longest alias wins (e.g. "ilm al-rijal" over "rijal")
    TERM_RE = new RegExp("(^|[^\\w'’-])(" + alts.join("|") + ")(?=$|[^\\w'’-])", "gi");
  })();
  const linkTerms = text => !TERM_RE ? text :
    text.replace(TERM_RE, (m, pre, w) =>
      `${pre}<button type="button" class="term-link" data-term="${TERM_MAP[w.toLowerCase()]}">${w}</button>`);
  const openGlossary = key => openCasebook("glossary", key);

  /* ---------------------------------------------------------------- screens */
  function show(screen) {
    $("#hub").classList.toggle("hidden", screen !== "hub");
    $("#chapter").classList.toggle("hidden", screen !== "chapter");
  }

  function chapterUnlocked(ch) {
    if (ch.order === 1) return true;
    const prev = C.chapters.find(c => c.order === ch.order - 1);
    return prev ? state.completed.has(prev.id) : true;
  }

  function renderHub() {
    $("#hubImage").src = C.hub.image;
    $("#hubIntro").textContent = C.hub.intro;
    const grid = $("#chapterGrid"); grid.innerHTML = "";
    C.chapters.forEach(ch => {
      const unlocked = chapterUnlocked(ch), done = state.completed.has(ch.id);
      const card = document.createElement("button");
      card.className = "chapter-card" + (unlocked ? "" : " locked") + (done ? " done" : "");
      card.disabled = !unlocked;
      card.innerHTML =
        `<span class="cc-badge">${ch.badge}</span>` +
        `<span class="cc-diff diff-${ch.difficulty}">${ch.difficulty}</span>` +
        `<h3>${ch.title}</h3><p>${ch.teaser}</p>` +
        `<span class="cc-foot">${done ? "✓ Completed · replay" : unlocked ? "Enter →" : "🔒 Finish the previous chapter"}</span>`;
      if (unlocked) card.onclick = () => enterChapter(ch.id);
      grid.appendChild(card);
    });
    $("#hubInsight").textContent = state.insight;
    $("#hubTrust").textContent = state.trust;
    show("hub");
  }

  /* --------------------------------------------------------------- chapter */
  function enterChapter(id) {
    const ch = C.chapters.find(c => c.id === id); if (!ch) return;
    state.chapter = ch; state.phase = "intro"; state.found = new Set(); state.focus = false;

    $("#chBadge").textContent = ch.badge;
    $("#chPlace").textContent = ch.place;
    $("#chTitle").textContent = ch.title;
    $("#chEra").textContent = ch.era;
    $("#objectiveText").textContent = ch.objective;
    $("#brandSeal").textContent = C.brandWord;
    $("#chapter").className = "screen diff-" + ch.difficulty;
    $("#chainBtn").classList.toggle("hidden", !ch.chain);

    const need = requiredClues(ch).length;
    $("#evidenceCount").textContent = `Evidence 0 / ${need}`;
    $$(".evidence-row i").forEach(x => x.classList.remove("found"));
    const guide = $("#guide");
    guide.textContent = ch.guide || "";
    guide.classList.toggle("hidden", !ch.guide || ch.difficulty !== "easy");

    syncHud(); show("chapter");
    World.load(ch, { onExamine: investigate, onSpeak: talkToTeacher });
    if (A()) A().startBed(ch.tint);
    openDialogue(ch.intro, "intro");
  }

  function talkToTeacher() {
    const ch = state.chapter;
    if (state.phase === "investigate") {
      if (state.found.size < requiredClues(ch).length) { toast("Find the evidence in the street first, then return."); return; }
      openDialogue(ch.resolve, "resolve");
    } else if (state.phase === "intro") {
      openDialogue(ch.intro, "intro");
    } else {
      openDialogue(ch.resolve, "resolve");
    }
  }

  function setFocus(on = !state.focus) {
    state.focus = on;
    $("#chapter").classList.toggle("focused", on);
    $("#focusBtn").setAttribute("aria-pressed", String(on));
    if (window.World) World.setFocus(on);
    toast(on ? "Scholar's Focus reveals the evidence markers" : "Scholar's Focus closed");
  }

  function investigate(key) {
    const ch = state.chapter;
    const clue = ch.clues.find(c => c.key === key); if (!clue) return;
    if (state.found.has(key)) { toast("Already recorded in the casebook"); return; }

    state.found.add(key);
    if (window.World) World.setFound(key);

    if (clue.decoy) { reward(0, -1); toast("Recorded — but is an endorsement really evidence?"); }
    else { reward(10, 0); if (A()) A().chime(); burst(); toast(`${clue.title} recorded · Insight +10`); }

    const need = requiredClues(ch).length;
    const have = requiredClues(ch).filter(c => state.found.has(c.key)).length;
    $("#evidenceCount").textContent = `Evidence ${have} / ${need}`;
    $$(".evidence-row i").forEach((x, i) => x.classList.toggle("found", i < have));

    if (have >= need) {
      $("#objectiveText").textContent = "Return to the teacher";
      toast("Evidence gathered — walk back to the teacher");
    }
  }

  /* -------------------------------------------------------------- dialogue */
  function openDialogue(list, phase) {
    state.dialogue = list; state.phase = phase; state.step = 0;
    const ch = state.chapter;
    $("#dPlace").textContent = ch.teacher.role;
    $("#dName").textContent = ch.teacher.name;
    $("#dialogue").classList.remove("hidden");
    renderDialogue();
  }
  const closeDialogue = () => $("#dialogue").classList.add("hidden");

  let _typer = null;
  // Terms are linkified only once the line has fully typed (or instantly under
  // prefers-reduced-motion / on skip), so a tappable button never appears
  // mid-word during the typewriter animation.
  function typeText(full) {
    const el = $("#dText"); el._full = full;
    clearInterval(_typer); _typer = null;
    if (reduced()) { el.innerHTML = linkTerms(full); state.mirror.read++; save(); return; }
    el.textContent = ""; let i = 0;
    _typer = setInterval(() => {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) { clearInterval(_typer); _typer = null; el.innerHTML = linkTerms(full); state.mirror.read++; save(); }   // read a line to the end = patience
    }, 16);
  }
  function skipType() {
    if (_typer) { clearInterval(_typer); _typer = null; state.mirror.skip++; save(); }   // interrupted mid-line = hurry
    const el = $("#dText"); if (el._full) el.innerHTML = linkTerms(el._full);
  }

  function renderDialogue() {
    const d = state.dialogue[state.step];
    typeText(d.text);
    $("#dStep").textContent = `Conversation · ${state.step + 1} / ${state.dialogue.length}`;
    const box = $("#choices"); box.innerHTML = "";
    d.choices.forEach(choice => {
      const b = document.createElement("button");
      b.textContent = choice.label;
      b.onclick = () => choose(choice);
      box.appendChild(b);
    });
  }

  function choose(choice) {
    if (A()) A().tick();
    if (choice.insight || choice.trust) reward(choice.insight || 0, choice.trust || 0);
    if (choice.toast) toast(choice.toast);
    const to = choice.to;
    if (to === "investigate") {
      closeDialogue();
      state.phase = "investigate";
      const need = requiredClues(state.chapter).length;
      $("#objectiveText").textContent = `Explore the street — find ${need} clues`;
      setFocus(true);
      return;
    }
    if (to === "complete") { closeDialogue(); completeChapter(); return; }
    if (to === "close") { closeDialogue(); return; }
    if (typeof to === "number") { state.step = to; renderDialogue(); return; }
    state.step = Math.min(state.step + 1, state.dialogue.length - 1);
    renderDialogue();
  }

  function completeChapter() {
    const ch = state.chapter;
    const first = !state.completed.has(ch.id);
    state.completed.add(ch.id); save();
    const next = C.chapters.find(c => c.order === ch.order + 1);
    const msg = first ? `Chapter complete — “${ch.title}”.` : `Revisited — “${ch.title}”.`;
    const more = next && !state.completed.has(next.id) ? ` Next unlocked: “${next.title}”.` : "";
    if (window.World) World.unload();
    if (A()) A().stopBed();
    setTimeout(() => { renderHub(); toast(msg + more); }, 250);
  }

  /* ---------------------------------------------------- circle of stillness */
  function enterHalaqa() {
    const h = C.halaqa; if (!h) return;
    state.chapter = null; state.inHalaqa = true; state.seated = false;
    $("#chTitle").textContent = h.title;
    $("#chEra").textContent = h.place;
    $("#brandSeal").textContent = C.brandWord;
    $("#chapter").className = "screen in-halaqa";
    $("#chainBtn").classList.add("hidden");
    show("chapter");
    World.loadHalaqa({ onSitChange: onSit });
    if (A()) A().startBed("cool");
    toast(h.invite);
  }

  function onSit(on) {
    state.seated = on;
    $("#chapter").classList.toggle("seated", on);
    clearInterval(state._sitTimer);
    if (on) {
      state.sitStart = Date.now();
      state._sitTimer = setInterval(() => { accrueSit(); state.sitStart = Date.now(); }, 15000);  // save presence even if they never rise
      if (A()) A().stillOn(); openStill();
    } else {
      accrueSit(); if (A()) A().stillOff(); clearTimeout(stillHushT);
      const panel = $("#stillPanel"); panel.classList.remove("hushed"); panel.classList.add("leaving");
      setTimeout(() => { panel.classList.add("hidden"); panel.classList.remove("leaving"); }, 1200);   // ease the rise — hold a breath
    }
  }
  function accrueSit() {
    if (!state.sitStart) return;
    state.mirror.presenceSec += Math.max(0, Math.round((Date.now() - state.sitStart) / 1000));
    state.sitStart = 0; save();
  }

  let stillIdx = 0, stillHushT = 0;
  function renderStillLine(h) {
    const a = h.ambient[stillIdx % h.ambient.length];
    $("#stillSpeaker").textContent = a.who;
    $("#stillLine").textContent = a.line;
  }
  function baseChips(h) {
    const chips = $("#stillChoices"); chips.innerHTML = "";
    const mk = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = fn; chips.appendChild(b); };
    mk("Sit in silence", () => {                                 // the one choice that promises nothing now delivers real dead air
      const panel = $("#stillPanel");
      panel.classList.add("hushed"); $("#stillSpeaker").textContent = ""; $("#stillLine").textContent = "";
      clearTimeout(stillHushT);
      stillHushT = setTimeout(() => { stillIdx++; renderStillLine(h); panel.classList.remove("hushed"); }, 4200);
    });
    mk("Offer an intention", () => { clearTimeout(stillHushT); $("#stillPanel").classList.remove("hushed"); offerIntention(h); });
    mk("Rise", () => World.rise());
  }
  function offerIntention(h) {
    const chips = $("#stillChoices"); chips.innerHTML = "";
    h.intentions.forEach(t => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = t;
      b.onclick = () => { $("#stillSpeaker").textContent = "The circle"; $("#stillLine").textContent = h.intentionAck; if (A()) A().chime(); baseChips(h); };
      chips.appendChild(b);
    });
    const back = document.createElement("button"); back.type = "button"; back.textContent = "Not now"; back.onclick = () => baseChips(h); chips.appendChild(back);
  }
  function openStill() {
    const h = C.halaqa; stillIdx = 0;
    renderStillLine(h); baseChips(h);
    $("#stillPanel").classList.remove("hidden");
  }

  /* -------------------------------------------------------- gate of wonder */
  // Station 1, the arrival: walk night Baghdad and behold it — no task, no reward.
  let gateIdx = 0, gateTimer = 0;
  function enterGate() {
    const g = C.gate; if (!g) return;
    state.chapter = null; state.inGate = true;
    $("#chTitle").textContent = g.title;
    $("#chEra").textContent = g.place;
    $("#brandSeal").textContent = C.brandWord;
    $("#chapter").className = "screen in-gate";
    show("chapter");
    World.loadGate({ id: "gate", tint: "warm", landmark: "library", mood: { stars: 460, horizonLift: 0.42 } });
    if (A()) A().startBed("warm");
    gateIdx = 0; $("#gateLine").textContent = g.lines[0];
    clearInterval(gateTimer);
    gateTimer = setInterval(() => {
      gateIdx = (gateIdx + 1) % g.lines.length;
      const el = $("#gateLine"); el.style.opacity = "0";
      setTimeout(() => { el.textContent = g.lines[gateIdx]; el.style.opacity = "1"; }, 700);   // soft cross-fade of wonder lines
    }, 6500);
    $("#gatePanel").classList.remove("hidden");
  }

  /* -------------------------------------------------- the return (encounter) */
  // A pure-dialogue street scene: method + stillness as conduct. Reuses the
  // dialogue overlay; restraint ("its reliability is not established") wins.
  let encStep = 0;
  function enterReturn() {
    const e = C.encounter; if (!e) return;
    encStep = 0;
    $("#dPlace").textContent = e.speaker.role;
    $("#dName").textContent = e.speaker.name;
    if (A()) { A().init(); A().resume(); }
    $("#dialogue").classList.remove("hidden");
    renderEncounter();
  }
  function renderEncounter() {
    const s = C.encounter.steps[encStep];
    typeText(s.text);
    $("#dStep").textContent = "In the street";
    const box = $("#choices"); box.innerHTML = "";
    s.choices.forEach(c => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = c.label;
      b.onclick = () => chooseEncounter(c);
      box.appendChild(b);
    });
  }
  function chooseEncounter(c) {
    if (A()) A().tick();
    if (c.toast) toast(c.toast);
    if (c.to === "close") { closeDialogue(); toast(C.encounter.note); return; }
    encStep = c.to; renderEncounter();
  }

  function exitWorld() {
    clearInterval(state._sitTimer); clearTimeout(stillHushT);
    if (state.seated) accrueSit();
    if (window.World) World.unload();
    if (A()) { A().stillOff(); A().stopBed(); }
    state.inHalaqa = false; state.seated = false; state.inGate = false;
    clearInterval(gateTimer); $("#gatePanel").classList.add("hidden");
    $("#stillPanel").classList.add("hidden"); $("#stillPanel").classList.remove("hushed", "leaving");
    save();
  }

  /* -------------------------------------------------------------- casebook */
  // Sanad (chain-of-narrators) diagram: a static, string-built inline SVG of
  // geometric seals (no faces). Nodes tied to found clues light up; the weak
  // link carries a dashed amber ring and reveals the chapter's EXISTING teaching.
  function renderChain(ch) {
    const chain = ch.chain;
    if (!chain) return `<p class="sheet-intro">No chain is recorded for this chapter yet.</p>`;
    const W = 320, cx = W / 2, GAP = 98, TOP = 44;
    const H = TOP + GAP * (chain.nodes.length - 1) + 72;
    const yOf = i => TOP + i * GAP;
    const edges = chain.nodes.slice(0, -1).map((_, i) =>
      `<line class="chain-edge${chain.broken === i ? " broken" : ""}" x1="${cx}" y1="${yOf(i) + 28}" x2="${cx}" y2="${yOf(i + 1) - 28}"${chain.broken === i ? ' stroke-dasharray="4 6"' : ""}/>`
    ).join("");
    const nodes = chain.nodes.map((n, i) => {
      const lit = !n.clue || state.found.has(n.clue);
      const y = yOf(i);
      return `<g class="chain-node ${lit ? "lit" : "dim"}${i === chain.weak ? " weak" : ""}" data-node="${i}" tabindex="0" role="button" aria-label="${n.label}">` +
        (i === chain.weak ? `<circle class="weak-ring" cx="${cx}" cy="${y}" r="31"/>` : "") +
        `<rect class="seal-bg" x="${cx - 22}" y="${y - 22}" width="44" height="44" rx="10"/>` +
        `<path class="seal-mark" d="M${cx} ${y - 13} L${cx + 13} ${y} L${cx} ${y + 13} L${cx - 13} ${y} Z"/>` +
        `<circle class="seal-dot" cx="${cx}" cy="${y}" r="2.6"/>` +
        `<text class="chain-label" x="${cx}" y="${y + 42}" text-anchor="middle">${n.label}</text>` +
        `</g>`;
    }).join("");
    return `<p class="sheet-intro">${chain.heading}</p>` +
      `<svg class="chain-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Chain of narrators — tap a seal to weigh the link">${edges}${nodes}</svg>` +
      `<div id="chainDetail" class="record chain-detail hidden"></div>` +
      `<div class="source-note">${ch.guardrail}</div>`;
  }

  function wireChain(ch) {
    const chain = ch.chain; if (!chain) return;
    const gate = chain.weakRequires || (chain.nodes[chain.weak] && chain.nodes[chain.weak].clue);
    const show = i => {
      const n = chain.nodes[i], isWeak = i === chain.weak;
      const lit = !n.clue || state.found.has(n.clue);
      const unlocked = !gate || state.found.has(gate);
      const body = isWeak
        ? (unlocked ? chain.why : chain.lockedWhy)
        : (lit ? n.trait : "Undiscovered. Walk the street and examine the markers to learn about this link.");
      const el = $("#chainDetail");
      el.innerHTML = `<span>${isWeak ? "Weak link" : `Link ${i + 1} of ${chain.nodes.length}`}</span>` +
        `<strong>${n.label}</strong><p>${body}</p>`;
      el.classList.remove("hidden");
      el.classList.toggle("is-weak", isWeak && unlocked);
      if (isWeak && unlocked && A()) A().tick();
    };
    $$("#sheetBody .chain-node").forEach(g => {
      const i = +g.dataset.node;
      g.onclick = () => show(i);
      g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i); } };
    });
  }

  // The Mirror — reflects how the player has PLAYED, never grades the soul.
  // The permanent note is non-negotiable and sits above every observation.
  function renderMirror() {
    const m = state.mirror, mr = C.mirror || {}, obs = [];
    if (m.care > 0) obs.push(["Care", `You opened the glossary ${m.care} time${m.care > 1 ? "s" : ""} to understand a word before moving on.`]);
    const total = m.read + m.skip;
    if (total > 0) obs.push(["Patience", `You read ${m.read} of ${total} lines to the end.`]);   // plain — the Mirror never editorializes
    if (m.presenceSec > 0) {
      const p = m.presenceSec < 30 ? "a few breaths" : m.presenceSec < 180 ? "a little while" : m.presenceSec < 900 ? "a while" : "a long while";
      obs.push(["Presence", `You have sat in the circle for ${p}.`]);   // graduated language — no number to farm
    }
    if (state.completed.size) obs.push(["The path", `You have walked ${state.completed.size} station${state.completed.size > 1 ? "s" : ""} of the way.`]);
    const body = obs.length
      ? obs.map(([k, v]) => `<div class="record"><span>${k}</span><p>${v}</p></div>`).join("")
      : `<div class="record"><p>Walk a while, read with care, and sit in the circle — the mirror fills as you go.</p></div>`;
    return `<div class="mirror-note">${mr.note || "This reflects your play, not your nafs — only Allah knows the hearts."}</div>` +
      (mr.intro ? `<p class="sheet-intro">${mr.intro}</p>` : "") + body;
  }

  // Tab strip prepended to every casebook view so all sections are reachable
  // without an index.html change. Chain/Glossary/Mirror tabs appear only when present.
  const tabsHtml = (active, ch) => {
    const tabs = [["journal", "Casebook"], ["sources", "Sources"]];
    if (ch.chain) tabs.push(["chain", "Sanad"]);
    if (C.glossary) tabs.push(["glossary", "Glossary"]);
    if (C.mirror) tabs.push(["mirror", "Mirror"]);
    return `<div class="sheet-tabs" role="group" aria-label="Casebook sections">` +
      tabs.map(([t, l]) => `<button type="button" data-tab="${t}" aria-pressed="${t === active}">${l}</button>`).join("") +
      `</div>`;
  };

  function openCasebook(type, focusKey) {
    const ch = state.chapter || C.chapters[0];
    const isSources = type === "sources", isChain = type === "chain", isGloss = type === "glossary", isMirror = type === "mirror";
    $("#sheetEyebrow").textContent = isMirror ? "A quiet reflection" : isGloss ? "Words of the craft" : isChain ? "Chain of narrators · sanad" : isSources ? "Method & source notes" : "Investigation record";
    $("#sheetTitle").textContent = isMirror ? (C.mirror ? C.mirror.title : "The Mirror") : isGloss ? "Glossary" : isChain ? "The Chain" : isSources ? "How reports are checked" : ch.title;
    let html = tabsHtml(type || "journal", ch);
    if (isMirror) {
      html += renderMirror();
    } else if (isGloss) {
      state.mirror.care++; save();
      const g = C.glossary;
      html += `<p class="sheet-intro">Tap any golden word in the story to jump here. Plain words first — the craft terms follow.</p>` +
        Object.keys(g).map(k => {
          const t = g[k];
          return `<div class="record" id="gloss-${k}" tabindex="-1"><span>${t.term}${t.arabic ? ` · <i class="term-arabic">${t.arabic}</i>` : ""}</span>` +
            `<strong>${t.short}</strong><p>${t.def}</p></div>`;
        }).join("") +
        `<div class="source-note">${C.glossaryNote || "Plain-language starter definitions. Full technical meanings belong to qualified scholars."}</div>`;
    } else if (isChain) {
      html += renderChain(ch);
    } else if (isSources) {
      html += `<p class="sheet-intro">This story teaches source literacy — not independent hadith grading or religious rulings.</p>` +
        ch.sources.map(s => `<div class="record"><span>${s.label}</span><p>${linkTerms(s.note)}</p></div>`).join("") +
        `<div class="source-note">${ch.guardrail}</div>`;
    } else {
      html += `<p class="sheet-intro">Evidence gathered in ${ch.place}.</p>` +
        ch.clues.map((c, i) => {
          const got = state.found.has(c.key);
          return `<div class="record ${got ? "" : "locked"}"><span>Evidence ${i + 1}${c.decoy ? " · decoy" : ""}</span>` +
            `<strong>${got ? c.title : "Undiscovered"}</strong>` +
            `<p>${got ? linkTerms(c.copy) : "Walk the street and examine this marker to record it."}</p></div>`;
        }).join("") +
        `<div class="source-note">A fictional narrative built around real verification principles. Do not use the game alone to authenticate a report.</div>`;
    }
    $("#sheetBody").innerHTML = html;
    $$(".sheet-tabs button").forEach(b => b.onclick = () => openCasebook(b.dataset.tab));
    if (isChain) wireChain(ch);
    $("#casebook").classList.remove("hidden");
    if (isGloss && focusKey) {
      const row = $("#gloss-" + focusKey);
      if (row) {
        row.classList.add("flash"); row.focus({ preventScroll: true });
        row.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
        setTimeout(() => row.classList.remove("flash"), 1600);
      }
    }
  }
  const closeCasebook = () => $("#casebook").classList.add("hidden");

  /* ------------------------------------------------------------ suggestion */
  const openSuggest = () => { $("#suggest").classList.remove("hidden"); $("#suggestText").focus(); };
  const closeSuggest = () => $("#suggest").classList.add("hidden");

  async function sendSuggest() {
    const text = $("#suggestText").value.trim();
    if (text.length < 3) { toast("Write a little more, then send."); return; }
    const entry = { text, chapter: state.chapter ? state.chapter.id : "hub", at: new Date().toISOString() };
    try {
      const list = JSON.parse(localStorage.getItem(SUGGEST_KEY) || "[]");
      list.push(entry); localStorage.setItem(SUGGEST_KEY, JSON.stringify(list));
    } catch {}
    const cfg = window.POL_CONFIG;
    if (cfg && cfg.supabaseUrl && cfg.supabaseKey) {
      try {
        await fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.suggestionsTable || "pol_suggestions"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": cfg.supabaseKey, "Authorization": "Bearer " + cfg.supabaseKey, "Prefer": "return=minimal" },
          body: JSON.stringify({ text: entry.text, chapter: entry.chapter })
        });
      } catch {}
    }
    $("#suggestText").value = ""; closeSuggest();
    toast("Thank you — your idea was saved.");
  }

  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const A = () => window.Ambience;

  function countUp(el, to) {
    if (!el) return;
    if (reduced()) { el.textContent = to; return; }
    const from = parseInt(el.textContent, 10) || 0;
    if (from === to) { el.textContent = to; return; }
    clearInterval(el._cu); const steps = 12; let n = 0;
    el._cu = setInterval(() => { n++; el.textContent = Math.round(from + (to - from) * n / steps); if (n >= steps) { clearInterval(el._cu); el.textContent = to; } }, 28);
  }
  function burst() {
    if (reduced()) return;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div"); p.className = "pip";
      p.style.left = (46 + Math.random() * 8) + "%";
      p.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
      p.style.animationDelay = Math.round(Math.random() * 90) + "ms";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }
  const syncHud = () => { countUp($("#insight"), state.insight); countUp($("#trust"), state.trust); };

  /* ------------------------------------------------------------------- pwa */
  function registerSW() {
    if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
    navigator.serviceWorker.register("sw.js").then(reg => {
      const showUpdate = () => {
        const b = $("#updateBanner");
        if (!b) return;
        b.onclick = () => { b.disabled = true; location.reload(); };
        b.classList.remove("hidden");
      };
      // update already downloaded before this ran (page loaded while a worker was waiting)
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate();
      // update arrives while the page is open
      reg.addEventListener("updatefound", () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener("statechange", () => {
          // controller check = this is an UPDATE, not the first-ever install
          if (w.state === "installed" && navigator.serviceWorker.controller) showUpdate();
        });
      });
    }).catch(() => {});
  }
  let deferredPrompt = null;
  function wireInstall() {
    addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; $("#installBtn").classList.remove("hidden"); });
    $("#installBtn").onclick = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("#installBtn").classList.add("hidden"); };
    addEventListener("appinstalled", () => $("#installBtn").classList.add("hidden"));
  }

  /* ------------------------------------------------------------------ wire */
  function init() {
    $("#beginBtn").onclick = () => { if (A()) { A().init(); A().resume(); } $("#opening").classList.add("hidden"); renderHub(); };
    $("#backBtn").onclick = () => { exitWorld(); renderHub(); };
    $("#circleBtn").onclick = enterHalaqa;
    $("#returnBtn").onclick = enterReturn;
    $("#gateBtn").onclick = enterGate;
    $("#gateBegin").onclick = () => { exitWorld(); renderHub(); };
    $("#focusBtn").onclick = () => setFocus();
    $("#journalBtn").onclick = () => openCasebook("journal");
    $("#sourcesBtn").onclick = () => openCasebook("sources");
    $("#chainBtn").onclick = () => openCasebook("chain");
    $("#controlsBtn").onclick = () => toast("Click to look · WASD / joystick to walk · E or tap to interact · Esc to close");
    const updateSound = m => { $("#soundBtn").classList.toggle("muted", m); $("#soundBtn").setAttribute("aria-pressed", String(!m)); $("#soundLabel").textContent = m ? "Muted" : "Sound"; };
    $("#soundBtn").onclick = () => { if (A()) { A().init(); A().resume(); updateSound(A().toggleMute()); } };
    if (A()) updateSound(A().isMuted());
    // Tapping a glossary term opens the glossary; tapping plain text still skips.
    $("#dText").onclick = e => { if (e.target.closest("[data-term]")) return; skipType(); };
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-term]");
      if (t) openGlossary(t.dataset.term);
    });
    $$("[data-close]").forEach(x => x.onclick = closeCasebook);
    $("#closeDialogue").onclick = closeDialogue;
    $$("[data-suggest-open]").forEach(x => x.onclick = openSuggest);
    $("#suggestSend").onclick = sendSuggest;
    $("#suggestClose").onclick = closeSuggest;

    addEventListener("keydown", e => {
      if ($("#chapter").classList.contains("hidden")) return;
      const k = e.key.toLowerCase();
      if (k === "q") setFocus();
      if (e.key === "Enter" && !$("#dialogue").classList.contains("hidden")) skipType();
      if (e.key === "Escape") { closeDialogue(); closeCasebook(); closeSuggest(); }
    });

    syncHud(); registerSW(); wireInstall();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
