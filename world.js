/*
  The Path of Light — walkable 3D world (Three.js r128, global, no modules).
  Reusable module driven by game.js. Retro low-poly first-person Baghdad street.
  API:
    World.load(chapter, { onExamine(key), onSpeak() })  build + start
    World.unload()                                       stop + dispose
    World.setFound(key)                                  dim an examined clue
    World.setFocus(bool)                                 reveal all markers
  Movement/look/interaction handled internally. Pauses while a modal overlay is open.
*/
window.World = (function () {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  let renderer, scene, camera, canvas, labelLayer, promptEl, promptText, actBtn, joyEl, knob;
  let inited = false, active = false, focus = false, revealAll = false, revealDist = 13, raf = 0, last = 0, locked = false;
  let interactables = [], current = null, cbs = {};
  const keys = {};
  const player = { pos: new THREE.Vector3(0, 1.6, 9), yaw: 0, pitch: 0 };
  const joy = { active: false, id: -1, cx: 0, cy: 0, dx: 0, dy: 0 };
  const lookT = { id: -1, x: 0, y: 0 };
  const proj = new THREE.Vector3();
  const CORRIDOR = 3.4, ZMIN = -30, ZMAX = 11;

  const modalOpen = () => !!document.querySelector("#dialogue:not(.hidden),#casebook:not(.hidden),#suggest:not(.hidden),#opening:not(.hidden)");

  function size() {
    const w = innerWidth || document.documentElement.clientWidth || 800;
    const h = innerHeight || document.documentElement.clientHeight || 600;
    if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (renderer) renderer.setSize(w, h);
  }

  function ensure() {
    if (inited) return;
    canvas = document.getElementById("world");
    labelLayer = document.getElementById("worldLabels");
    promptEl = document.getElementById("interactPrompt");
    promptText = document.getElementById("interactText");
    actBtn = document.getElementById("actBtn");
    joyEl = document.getElementById("joy");
    knob = document.getElementById("knob");

    renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(0.66);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(74, 1, 0.1, 140);
    camera.rotation.order = "YXZ";
    size();

    addEventListener("keydown", e => {
      const k = e.key.toLowerCase(); keys[k] = true;
      if (active && !modalOpen() && k === "e" && current) fire(current);
    });
    addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener("click", () => {
      if (active && !isTouch && !modalOpen() && canvas.requestPointerLock) canvas.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === canvas; });
    document.addEventListener("mousemove", e => {
      if (!locked || !active) return;
      player.yaw -= e.movementX * 0.0022;
      player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.3, 1.3);
    });
    addEventListener("resize", size);

    if (isTouch) {
      joyEl.addEventListener("touchstart", e => {
        const t = e.changedTouches[0], r = joyEl.getBoundingClientRect();
        joy.active = true; joy.id = t.identifier; joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2;
      }, { passive: true });
      canvas.addEventListener("touchstart", e => {
        const t = e.changedTouches[0];
        if (lookT.id === -1) { lookT.id = t.identifier; lookT.x = t.clientX; lookT.y = t.clientY; }
      }, { passive: true });
      addEventListener("touchmove", e => {
        if (!active || modalOpen()) return;
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id && joy.active) {
            let dx = t.clientX - joy.cx, dy = t.clientY - joy.cy;
            const m = Math.hypot(dx, dy), mx = 46; if (m > mx) { dx *= mx / m; dy *= mx / m; }
            joy.dx = dx / mx; joy.dy = dy / mx; knob.style.transform = `translate(${dx}px,${dy}px)`;
          } else if (t.identifier === lookT.id) {
            player.yaw -= (t.clientX - lookT.x) * 0.006;
            player.pitch = clamp(player.pitch - (t.clientY - lookT.y) * 0.006, -1.3, 1.3);
            lookT.x = t.clientX; lookT.y = t.clientY;
          }
        }
      }, { passive: true });
      addEventListener("touchend", e => {
        for (const t of e.changedTouches) {
          if (t.identifier === joy.id) { joy.active = false; joy.id = -1; joy.dx = joy.dy = 0; knob.style.transform = ""; }
          if (t.identifier === lookT.id) lookT.id = -1;
        }
      }, { passive: true });
      actBtn.addEventListener("touchstart", e => { e.preventDefault(); if (active && current) fire(current); });
    }
    inited = true;
  }

  function clearScene() {
    interactables.forEach(t => t.el.remove());
    interactables = [];
    if (!scene) return;
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const o = scene.children[i]; scene.remove(o);
      o.traverse && o.traverse(n => {
        if (n.geometry) n.geometry.dispose();
        if (n.material) Array.isArray(n.material) ? n.material.forEach(m => m.dispose()) : n.material.dispose();
      });
    }
  }

  function buildStreet(tint) {
    const SKY = tint === "cool" ? 0x0b1830 : tint === "warm" ? 0x12203f : 0x0d1d3c;
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 6, 40);
    scene.add(new THREE.HemisphereLight(0x8ea6d6, 0x0a1220, 0.95));
    const d = new THREE.DirectionalLight(0xffe6a8, 0.55); d.position.set(-6, 14, 4); scene.add(d);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf7e6a8 }));
    moon.position.set(22, 20, -46); scene.add(moon);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 100), new THREE.MeshLambertMaterial({ color: 0x11213c }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const pathM = new THREE.Mesh(new THREE.PlaneGeometry(6, 76), new THREE.MeshLambertMaterial({ color: 0x1a2f52 }));
    pathM.rotation.x = -Math.PI / 2; pathM.position.set(0, 0.02, -12); scene.add(pathM);
    const wallC = [0x14284a, 0x102544, 0x1a2c50, 0x0f2140];
    const winMat = new THREE.MeshBasicMaterial({ color: 0xf2cd6a });
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const bld = (x, z, w, h, dep) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), new THREE.MeshLambertMaterial({ color: wallC[(Math.abs(x + z) | 0) % 4] }));
      b.position.set(x, h / 2, z); scene.add(b);
      const rows = Math.min(4, Math.floor(h / 2));
      for (let r = 0; r < rows; r++) for (let c = -1; c <= 1; c++) {
        if ((r + c + (z | 0)) % 2 === 0) continue;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
        win.position.set(x + (x < 0 ? w / 2 + 0.01 : -w / 2 - 0.01), 1.4 + r * 1.7, z + c * 1.2);
        win.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(win);
      }
    };
    for (let z = 10; z >= -30; z -= 4.4) { bld(-6 - rnd() * 2, z, 3 + rnd() * 2, 4 + rnd() * 7, 3.6); bld(6 + rnd() * 2, z, 3 + rnd() * 2, 4 + rnd() * 7, 3.6); }
    const crate = (x, z, s, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: col })); m.position.set(x, s / 2, z); scene.add(m); };
    crate(-2.6, 2, 1, 0x6b4a2a); crate(-2.1, 1.2, 0.7, 0x7a5630); crate(2.6, -4, 1, 0x2f6a5a); crate(2.4, -20, 1.1, 0x6b4a2a);
  }

  function addMarker(kind, key, label, x, z, color) {
    const g = new THREE.Group();
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.2, 8), new THREE.MeshBasicMaterial({ color }));
    pillar.position.y = 1.1; g.add(pillar);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    glow.position.y = 2.4; g.add(glow);
    g.position.set(x, 0, z); scene.add(g);
    const el = document.createElement("div"); el.className = "wlabel " + kind; el.textContent = label;
    labelLayer.appendChild(el);
    interactables.push({ kind, key, group: g, glow, el, label, pos: g.position });
  }

  function load(chapter, callbacks) {
    ensure(); cbs = callbacks || {}; focus = false;
    revealAll = chapter.difficulty === "easy";
    revealDist = chapter.difficulty === "hard" ? 6.5 : 13;
    clearScene(); buildStreet(chapter.tint);
    addMarker("teacher", "__teacher", chapter.teacher.name, 0, -22, 0xf2cd6a);
    const lane = [[-2.3, -4], [2.4, -9], [-2.5, -14], [2.3, -18]];
    chapter.clues.forEach((cl, i) => {
      const s = lane[i] || [i % 2 ? 2 : -2, -6 - i * 4];
      addMarker("clue", cl.key, cl.hint, s[0], s[1], cl.decoy ? 0xe88a5a : 0x3fb7b7);
    });
    player.pos.set(0, 1.6, 9); player.yaw = 0; player.pitch = 0;
    active = true;
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function unload() {
    active = false;
    if (locked && document.exitPointerLock) document.exitPointerLock();
    clearScene();
    if (promptEl) promptEl.style.display = "none";
    if (actBtn) actBtn.style.display = "none";
  }

  function setFound(key) {
    const t = interactables.find(x => x.key === key);
    if (t) { t.el.classList.add("done"); t.glow.material.opacity = 0.1; }
  }
  function setFocus(on) { focus = on; }
  function fire(t) { t.kind === "teacher" ? (cbs.onSpeak && cbs.onSpeak()) : (cbs.onExamine && cbs.onExamine(t.key)); }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!active) return;
    if (canvas.width === 0) size();
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    const paused = modalOpen();
    if (paused && locked && document.exitPointerLock) document.exitPointerLock();

    if (!paused) {
      let ix = 0, iy = 0;
      if (keys["w"] || keys["arrowup"]) iy += 1;
      if (keys["s"] || keys["arrowdown"]) iy -= 1;
      if (keys["a"] || keys["arrowleft"]) ix -= 1;
      if (keys["d"] || keys["arrowright"]) ix += 1;
      if (joy.active) { ix += joy.dx; iy -= joy.dy; }
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
      const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
      const mx = fx * iy + rx * ix, mz = fz * iy + rz * ix, ml = Math.hypot(mx, mz);
      if (ml > 0.001) {
        const sp = 3.6;
        player.pos.x = clamp(player.pos.x + (mx / ml) * sp * dt, -CORRIDOR, CORRIDOR);
        player.pos.z = clamp(player.pos.z + (mz / ml) * sp * dt, ZMIN, ZMAX);
      }
    }
    camera.position.copy(player.pos);
    camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;

    current = null; let best = 3.2;
    for (const t of interactables) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z, d = Math.hypot(dx, dz);
      proj.set(t.pos.x, 2.65, t.pos.z).project(camera);
      if (proj.z < 1) {
        const show = revealAll || focus || t.kind === "teacher" || d < revealDist;
        t.el.style.display = show ? "block" : "none";
        t.el.style.left = (proj.x * 0.5 + 0.5) * innerWidth + "px";
        t.el.style.top = (-proj.y * 0.5 + 0.5) * innerHeight + "px";
        t.el.style.opacity = Math.max(0.25, 1 - d / 28);
      } else t.el.style.display = "none";
      if (!paused && d < best) { best = d; current = t; }
      t.glow.position.y = 2.4 + Math.sin(now / 400 + t.pos.z) * 0.12;
    }

    if (!paused && current) {
      promptText.textContent = (current.kind === "teacher" ? "Speak with " : "Examine ") + current.label;
      promptEl.style.display = isTouch ? "none" : "flex";
      if (isTouch) { actBtn.style.display = "flex"; actBtn.textContent = current.kind === "teacher" ? "SPEAK" : "EXAMINE"; }
    } else {
      promptEl.style.display = "none";
      if (isTouch) actBtn.style.display = "none";
    }
    renderer.render(scene, camera);
  }

  return { load, unload, setFound, setFocus };
})();
