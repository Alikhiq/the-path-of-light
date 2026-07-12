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
    chapter: null, phase: "intro", dialogue: [], step: 0, found: new Set(), focus: false
  };

  const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify({
    insight: state.insight, trust: state.trust, completed: [...state.completed]
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
  function typeText(full) {
    const el = $("#dText"); el._full = full;
    clearInterval(_typer); _typer = null;
    if (reduced()) { el.textContent = full; return; }
    el.textContent = ""; let i = 0;
    _typer = setInterval(() => { el.textContent = full.slice(0, ++i); if (i >= full.length) { clearInterval(_typer); _typer = null; } }, 16);
  }
  function skipType() { if (_typer) { clearInterval(_typer); _typer = null; } const el = $("#dText"); if (el._full) el.textContent = el._full; }

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

  /* -------------------------------------------------------------- casebook */
  function openCasebook(type) {
    const ch = state.chapter || C.chapters[0];
    const isSources = type === "sources";
    $("#sheetEyebrow").textContent = isSources ? "Method & source notes" : "Investigation record";
    $("#sheetTitle").textContent = isSources ? "How reports are checked" : ch.title;
    let html;
    if (isSources) {
      html = `<p class="sheet-intro">This story teaches source literacy — not independent hadith grading or religious rulings.</p>` +
        ch.sources.map(s => `<div class="record"><span>${s.label}</span><p>${s.note}</p></div>`).join("") +
        `<div class="source-note">${ch.guardrail}</div>`;
    } else {
      html = `<p class="sheet-intro">Evidence gathered in ${ch.place}.</p>` +
        ch.clues.map((c, i) => {
          const got = state.found.has(c.key);
          return `<div class="record ${got ? "" : "locked"}"><span>Evidence ${i + 1}${c.decoy ? " · decoy" : ""}</span>` +
            `<strong>${got ? c.title : "Undiscovered"}</strong>` +
            `<p>${got ? c.copy : "Walk the street and examine this marker to record it."}</p></div>`;
        }).join("") +
        `<div class="source-note">A fictional narrative built around real verification principles. Do not use the game alone to authenticate a report.</div>`;
    }
    $("#sheetBody").innerHTML = html;
    $("#casebook").classList.remove("hidden");
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
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
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
    $("#backBtn").onclick = () => { if (window.World) World.unload(); if (A()) A().stopBed(); save(); renderHub(); };
    $("#focusBtn").onclick = () => setFocus();
    $("#journalBtn").onclick = () => openCasebook("journal");
    $("#sourcesBtn").onclick = () => openCasebook("sources");
    $("#controlsBtn").onclick = () => toast("Click to look · WASD / joystick to walk · E or tap to interact · Esc to close");
    const updateSound = m => { $("#soundBtn").classList.toggle("muted", m); $("#soundBtn").setAttribute("aria-pressed", String(!m)); $("#soundLabel").textContent = m ? "Muted" : "Sound"; };
    $("#soundBtn").onclick = () => { if (A()) { A().init(); A().resume(); updateSound(A().toggleMute()); } };
    if (A()) updateSound(A().isMuted());
    $("#dText").onclick = skipType;
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
