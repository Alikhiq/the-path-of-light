/*
  The Path of Light — ENGINE
  Reads window.CONTENT (see content.js) and runs the game.
  You normally do not need to edit this file to change the story — edit content.js.
*/
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = window.CONTENT;

  const SAVE_KEY = "pol-save-v1";
  const SUGGEST_KEY = "pol-suggestions-v1";

  const load = () => {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
  };
  const saved = load();

  const state = {
    insight: Number.isFinite(saved.insight) ? saved.insight : 0,
    trust: Number.isFinite(saved.trust) ? saved.trust : 0,
    completed: new Set(saved.completed || []),
    // per-chapter runtime
    chapter: null,       // current chapter object
    phase: "intro",      // intro | investigate | resolve
    dialogue: [],        // active dialogue array
    step: 0,
    found: new Set(),
    focus: false,
    lookX: 0, lookY: 0
  };

  const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify({
    insight: state.insight, trust: state.trust, completed: [...state.completed]
  }));

  /* ---------------------------------------------------------------- helpers */
  function toast(t) {
    const el = $("#toast");
    el.textContent = t;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function reward(insight = 0, trust = 0) {
    if (insight) state.insight += insight;
    // Easy mode never punishes: drop negative trust for young players.
    if (trust < 0 && state.chapter && state.chapter.difficulty === "easy") trust = 0;
    state.trust = Math.max(0, state.trust + trust);
    syncHud();
    save();
  }

  function requiredClues(ch) { return ch.clues.filter(c => !c.decoy); }

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
    const grid = $("#chapterGrid");
    grid.innerHTML = "";
    C.chapters.forEach(ch => {
      const unlocked = chapterUnlocked(ch);
      const done = state.completed.has(ch.id);
      const card = document.createElement("button");
      card.className = "chapter-card" + (unlocked ? "" : " locked") + (done ? " done" : "");
      card.disabled = !unlocked;
      card.innerHTML =
        `<span class="cc-badge">${ch.badge}</span>` +
        `<span class="cc-diff diff-${ch.difficulty}">${ch.difficulty}</span>` +
        `<h3>${ch.title}</h3>` +
        `<p>${ch.teaser}</p>` +
        `<span class="cc-foot">${done ? "✓ Completed · replay" : unlocked ? "Begin →" : "🔒 Finish the previous chapter"}</span>`;
      if (unlocked) card.onclick = () => enterChapter(ch.id);
      grid.appendChild(card);
    });
    $("#hubInsight").textContent = state.insight;
    $("#hubTrust").textContent = state.trust;
    show("hub");
  }

  /* --------------------------------------------------------------- chapter */
  function enterChapter(id) {
    const ch = C.chapters.find(c => c.id === id);
    if (!ch) return;
    state.chapter = ch;
    state.phase = "intro";
    state.found = new Set();
    state.focus = false;
    state.lookX = 0; state.lookY = 0;

    const scene = $("#scene");
    scene.className = "scene tint-" + (ch.tint || "neutral");
    scene.style.setProperty("--look-x", "0%");
    scene.style.setProperty("--look-y", "0%");
    $("#sceneImg").src = ch.image;
    $("#sceneImg").alt = `A first-person view in ${ch.place}`;

    // HUD text
    $("#chBadge").textContent = ch.badge;
    $("#chPlace").textContent = ch.place;
    $("#chTitle").textContent = ch.title;
    $("#chEra").textContent = ch.era;
    $("#objectiveText").textContent = ch.objective;
    $("#brandSeal").textContent = C.brandWord;

    // difficulty class controls marker visibility + guide
    $("#chapter").className = "screen diff-" + ch.difficulty;
    const guide = $("#guide");
    guide.textContent = ch.guide || "";
    guide.classList.toggle("hidden", !ch.guide || ch.difficulty !== "easy");

    buildMarkers(ch);
    syncHud();
    show("chapter");
    openDialogue(ch.intro, "intro");
  }

  function buildMarkers(ch) {
    const scene = $("#scene");
    $$(".clue", scene).forEach(n => n.remove());
    $$(".character-marker", scene).forEach(n => n.remove());

    ch.clues.forEach(clue => {
      const b = document.createElement("button");
      b.className = "clue" + (clue.decoy ? " decoy" : "");
      b.style.left = clue.x + "%";
      b.style.top = clue.y + "%";
      b.setAttribute("aria-label", "Investigate: " + clue.hint);
      b.innerHTML = `<span class="clue-ring"></span><i>⌕</i><b>${clue.hint}</b>`;
      b.onclick = () => investigate(clue.key);
      scene.appendChild(b);
    });

    const m = document.createElement("button");
    m.id = "teacherMarker";
    m.className = "character-marker";
    m.setAttribute("aria-label", "Speak with " + ch.teacher.name);
    m.innerHTML = `<span class="marker-symbol">✦</span><b>${ch.teacher.name}</b><small>Tap to speak</small>`;
    m.onclick = () => talkToTeacher();
    scene.appendChild(m);
  }

  function talkToTeacher() {
    const ch = state.chapter;
    if (state.phase === "investigate") {
      if (state.found.size < requiredClues(ch).length) {
        toast("Find the evidence first, then return.");
        setFocus(true);
        return;
      }
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
    toast(on ? "Scholar's Focus reveals points of evidence" : "Scholar's Focus closed");
  }

  function investigate(key) {
    const ch = state.chapter;
    const clue = ch.clues.find(c => c.key === key);
    if (!clue) return;
    if (state.found.has(key)) { toast("Already recorded in the casebook"); return; }

    state.found.add(key);
    markMarkerFound(key);

    if (clue.decoy) {
      reward(0, -1);
      toast("Recorded — but is an endorsement really evidence?");
    } else {
      reward(10, 0);
      toast(`${clue.title} recorded · Insight +10`);
    }

    const need = requiredClues(ch).length;
    const have = requiredClues(ch).filter(c => state.found.has(c.key)).length;
    $("#evidenceCount").textContent = `Evidence ${have} / ${need}`;
    $$(".evidence-row i").forEach((x, i) => x.classList.toggle("found", i < have));

    if (have >= need) {
      $("#objectiveText").textContent = "Return to the teacher";
      toast("Evidence gathered — return to the teacher");
    }
  }

  function markMarkerFound(key) {
    const ch = state.chapter;
    const idx = ch.clues.findIndex(c => c.key === key);
    const btn = $$("#scene .clue")[idx];
    if (btn) btn.classList.add("found");
  }

  /* -------------------------------------------------------------- dialogue */
  function openDialogue(list, phase) {
    state.dialogue = list;
    state.phase = phase;
    state.step = 0;
    setFocus(false);
    const ch = state.chapter;
    $("#dPortrait").src = ch.teacher.portrait;
    $("#dPortrait").alt = ch.teacher.name;
    $("#dPlace").textContent = ch.teacher.role;
    $("#dName").textContent = ch.teacher.name;
    $("#dialogue").classList.remove("hidden");
    renderDialogue();
  }
  const closeDialogue = () => $("#dialogue").classList.add("hidden");

  function renderDialogue() {
    const d = state.dialogue[state.step];
    $("#dText").textContent = d.text;
    $("#dStep").textContent = `Conversation · ${state.step + 1} / ${state.dialogue.length}`;
    const box = $("#choices");
    box.innerHTML = "";
    d.choices.forEach(choice => {
      const b = document.createElement("button");
      b.textContent = choice.label;
      b.onclick = () => choose(choice);
      box.appendChild(b);
    });
  }

  function choose(choice) {
    if (choice.insight || choice.trust) reward(choice.insight || 0, choice.trust || 0);
    if (choice.toast) toast(choice.toast);

    const to = choice.to;
    if (to === "investigate") {
      closeDialogue();
      state.phase = "investigate";
      const need = requiredClues(state.chapter).length;
      $("#objectiveText").textContent = `Use Scholar's Focus to find ${need} clues`;
      $("#evidenceCount").textContent = `Evidence 0 / ${need}`;
      setFocus(true);
      return;
    }
    if (to === "complete") { closeDialogue(); completeChapter(); return; }
    if (to === "close") { closeDialogue(); return; }
    if (typeof to === "number") { state.step = to; renderDialogue(); return; }
    // default: advance
    state.step = Math.min(state.step + 1, state.dialogue.length - 1);
    renderDialogue();
  }

  function completeChapter() {
    const ch = state.chapter;
    const first = !state.completed.has(ch.id);
    state.completed.add(ch.id);
    save();
    const next = C.chapters.find(c => c.order === ch.order + 1);
    const msg = first
      ? `Chapter complete — “${ch.title}”.`
      : `Revisited — “${ch.title}”.`;
    const more = next && !state.completed.has(next.id) ? ` Next unlocked: “${next.title}”.` : "";
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
            `<p>${got ? c.copy : "Use Scholar's Focus in the street to find this clue."}</p></div>`;
        }).join("") +
        `<div class="source-note">A fictional narrative built around real verification principles. Do not use the game alone to authenticate a report.</div>`;
    }
    $("#sheetBody").innerHTML = html;
    $("#casebook").classList.remove("hidden");
  }
  const closeCasebook = () => $("#casebook").classList.add("hidden");

  /* ------------------------------------------------------------ suggestion */
  function openSuggest() { $("#suggest").classList.remove("hidden"); $("#suggestText").focus(); }
  const closeSuggest = () => $("#suggest").classList.add("hidden");

  async function sendSuggest() {
    const text = $("#suggestText").value.trim();
    if (text.length < 3) { toast("Write a little more, then send."); return; }
    const entry = { text, chapter: state.chapter ? state.chapter.id : "hub", at: new Date().toISOString() };
    try {
      const list = JSON.parse(localStorage.getItem(SUGGEST_KEY) || "[]");
      list.push(entry);
      localStorage.setItem(SUGGEST_KEY, JSON.stringify(list));
    } catch {}
    // Best-effort send to the database (Supabase REST). Local save above is the fallback.
    const cfg = window.POL_CONFIG;
    if (cfg && cfg.supabaseUrl && cfg.supabaseKey) {
      try {
        await fetch(`${cfg.supabaseUrl}/rest/v1/${cfg.suggestionsTable || "pol_suggestions"}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": cfg.supabaseKey,
            "Authorization": "Bearer " + cfg.supabaseKey,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ text: entry.text, chapter: entry.chapter })
        });
      } catch {}
    }
    $("#suggestText").value = "";
    closeSuggest();
    toast("Thank you — your idea was saved.");
  }

  /* ------------------------------------------------------------------- HUD */
  function syncHud() {
    $("#insight").textContent = state.insight;
    $("#trust").textContent = state.trust;
  }

  /* --------------------------------------------------------------- look/move */
  function applyLook() {
    $("#scene").style.setProperty("--look-x", state.lookX + "%");
    $("#scene").style.setProperty("--look-y", state.lookY + "%");
  }
  function lookFrom(clientX, clientY) {
    if (!$("#dialogue").classList.contains("hidden")) return;
    state.lookX = (clientX / innerWidth - 0.5) * -2.2;
    state.lookY = (clientY / innerHeight - 0.5) * -1.5;
    applyLook();
  }

  /* ------------------------------------------------------------------- pwa */
  function registerSW() {
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }
  let deferredPrompt = null;
  function wireInstall() {
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt = e;
      $("#installBtn").classList.remove("hidden");
    });
    $("#installBtn").onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $("#installBtn").classList.add("hidden");
    };
    window.addEventListener("appinstalled", () => $("#installBtn").classList.add("hidden"));
  }

  /* ------------------------------------------------------------------ wire */
  function init() {
    $("#beginBtn").onclick = () => { $("#opening").classList.add("hidden"); renderHub(); };
    $("#backBtn").onclick = () => { save(); renderHub(); };
    $("#focusBtn").onclick = () => setFocus();
    $("#journalBtn").onclick = () => openCasebook("journal");
    $("#sourcesBtn").onclick = () => openCasebook("sources");
    $("#controlsBtn").onclick = () => toast("Drag / mouse: look · Focus button or Q: reveal · Tap markers · Esc: close");
    $$("[data-close]").forEach(x => x.onclick = closeCasebook);
    $("#closeDialogue").onclick = closeDialogue;
    $$("[data-suggest-open]").forEach(x => x.onclick = openSuggest);
    $("#suggestSend").onclick = sendSuggest;
    $("#suggestClose").onclick = closeSuggest;

    window.addEventListener("mousemove", e => lookFrom(e.clientX, e.clientY));
    window.addEventListener("touchmove", e => {
      if (e.touches[0]) lookFrom(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("keydown", e => {
      const k = e.key.toLowerCase();
      if ($("#chapter").classList.contains("hidden")) return;
      if (k === "q") setFocus();
      if (k === "e") talkToTeacher();
      if (e.key === "Escape") { closeDialogue(); closeCasebook(); closeSuggest(); }
      const step = 0.4;
      if (["arrowleft", "a"].includes(k)) state.lookX = Math.min(2.5, state.lookX + step);
      if (["arrowright", "d"].includes(k)) state.lookX = Math.max(-2.5, state.lookX - step);
      if (["arrowup", "w"].includes(k)) state.lookY = Math.min(1.5, state.lookY + 0.3);
      if (["arrowdown", "s"].includes(k)) state.lookY = Math.max(-1.5, state.lookY - 0.3);
      applyLook();
    });

    syncHud();
    registerSW();
    wireInstall();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
