/*
  The Path of Light — ambient audio (WebAudio API).
  ENVIRONMENTAL ONLY, no music: a soft wind bed, a chime on evidence found, a faint
  tick on dialogue advance. Gesture-gated (context created on first user gesture),
  muteable, and persisted. Degrades silently where WebAudio is unavailable.
*/
window.Ambience = (function () {
  "use strict";
  const MUTE_KEY = "pol-muted-v1";
  const VOL = 0.85;
  let ctx = null, master = null, bed = null, muted = false, still = null;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;                       // unsupported — stay silent
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOL;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }
  function resume() { if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); }

  // pink-ish noise, one-shot buffer we loop for the wind bed
  function noiseBuffer(sec) {
    const n = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    return buf;
  }

  function startBed(tint) {
    init(); if (!ctx) return; resume();
    stopBed();
    bed = ctx.createGain(); bed.gain.value = 0;
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(3); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.value = tint === "cool" ? 420 : tint === "warm" ? 640 : 520;
    src.connect(lp); lp.connect(bed); bed.connect(master);
    src.start();
    bed.gain.setValueAtTime(0, ctx.currentTime);
    bed.gain.linearRampToValueAtTime(0.10, ctx.currentTime + 2);   // slow fade-in
    // slow LFO so the wind breathes
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.08; lfoG.gain.value = 0.035;
    lfo.connect(lfoG); lfoG.connect(bed.gain); lfo.start();
    bed._src = src; bed._lfo = lfo;
  }
  function stopBed() {
    if (!bed) return;
    try { bed._src && bed._src.stop(); } catch (e) {}
    try { bed._lfo && bed._lfo.stop(); } catch (e) {}
    try { bed.disconnect(); } catch (e) {}
    bed = null;
  }

  function blip(freq, t0, dur, type, peak) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function chime() {                        // evidence found — gentle rising triad
    init(); if (!ctx) return; resume();
    const t = ctx.currentTime, notes = [587.33, 783.99, 987.77];
    notes.forEach((f, i) => blip(f, t + i * 0.11, 0.5, "triangle", 0.16));
  }
  function tick() {                          // dialogue advance — faint
    init(); if (!ctx) return; resume();
    blip(300, ctx.currentTime, 0.05, "sine", 0.045);
  }

  // The Circle of Stillness: duck the ambient bed and raise one soft sustained drone.
  function stillOn() {
    init(); if (!ctx) return; resume();
    if (bed) bed.gain.setTargetAtTime(0.03, ctx.currentTime, 0.7);   // ambient recedes
    if (still) return;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.06, ctx.currentTime, 1.4);              // slow swell
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = 146.83;                   // low D
    o2.type = "sine"; o2.frequency.value = 220.0;                    // gentle upper
    o1.connect(g); o2.connect(g); g.connect(master);
    o1.start(); o2.start();
    still = { o1, o2, g };
  }
  function stillOff() {
    if (bed && ctx) bed.gain.setTargetAtTime(0.10, ctx.currentTime, 0.7); // ambient returns
    if (!still || !ctx) { still = null; return; }
    const s = still; still = null;
    try {
      s.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.5);
      setTimeout(() => { try { s.o1.stop(); s.o2.stop(); s.g.disconnect(); } catch (e) {} }, 1000);
    } catch (e) {}
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : VOL;
    return muted;
  }
  const toggleMute = () => setMuted(!muted);
  const isMuted = () => muted;

  return { init, resume, startBed, stopBed, chime, tick, stillOn, stillOff, toggleMute, isMuted, setMuted };
})();
