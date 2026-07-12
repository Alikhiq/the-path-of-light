/*
  The Path of Light — walkable 3D world (Three.js r128, global, no modules).
  v2: an explorable Baghdad district — a central plaza with branching streets,
  SOLID buildings (real collision), a fountain, lamps and gateways. Clues are
  scattered so you actually explore. Reusable module driven by game.js:
    World.load(chapter, { onExamine(key), onSpeak() })
    World.unload() · World.setFound(key) · World.setFocus(bool)
*/
window.World = (function () {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  let renderer, scene, camera, canvas, labelLayer, promptEl, promptText, actBtn, joyEl, knob;
  let inited = false, active = false, focus = false, revealAll = false, revealDist = 13, raf = 0, last = 0, locked = false;
  let interactables = [], colliders = [], current = null, cbs = {};
  const keys = {};
  const player = { pos: new THREE.Vector3(0, 1.6, 22), yaw: 0, pitch: 0 };
  const joy = { active: false, id: -1, cx: 0, cy: 0, dx: 0, dy: 0 };
  const lookT = { id: -1, x: 0, y: 0 };
  const proj = new THREE.Vector3();
  const BOUND = 23, PR = 0.55;

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
    camera = new THREE.PerspectiveCamera(74, 1, 0.1, 160);
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
    interactables = []; colliders = [];
    if (!scene) return;
    for (let i = scene.children.length - 1; i >= 0; i--) {
      const o = scene.children[i]; scene.remove(o);
      o.traverse && o.traverse(n => {
        if (n.geometry) n.geometry.dispose();
        if (n.material) Array.isArray(n.material) ? n.material.forEach(m => m.dispose()) : n.material.dispose();
      });
    }
  }

  const wallC = [0x14284a, 0x102544, 0x1a2c50, 0x0f2140];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  function box(x, z, w, h, dep, col) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), new THREE.MeshLambertMaterial({ color: col }));
    b.position.set(x, h / 2, z); scene.add(b); return b;
  }
  // one city block filling an AABB with a cluster of buildings; registers ONE collider
  function block(cx, cz, hx, hz) {
    colliders.push({ x: cx, z: cz, hx, hz });
    for (let gx = -hx + 2; gx < hx; gx += 4.2) for (let gz = -hz + 2; gz < hz; gz += 4.2) {
      const h = 4 + rnd() * 8;
      const b = box(cx + gx, cz + gz, 3.6, h, 3.6, wallC[(Math.abs((cx + gx) + (cz + gz)) | 0) % 4]);
      // window dots facing the nearest street (rough)
      const winMat = new THREE.MeshBasicMaterial({ color: 0xf2cd6a });
      const rows = Math.min(3, Math.floor(h / 2.4));
      for (let r = 0; r < rows; r++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
        const sx = cx + gx > 0 ? -1 : 1;
        win.position.set(cx + gx + sx * 1.85, 1.4 + r * 1.9, cz + gz);
        win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(win);
      }
    }
  }

  function lamp(x, z) {
    box(x, z, 0.18, 3, 0.18, 0x201a12);
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffdd88 }));
    g.position.set(x, 3.1, z); scene.add(g);
  }
  function gateway(x, z, along) { // simple arch framing a street entrance
    const w = along === "x" ? 0.6 : 8, d = along === "x" ? 8 : 0.6;
    box(x - (along === "x" ? 0 : 3.7), z - (along === "x" ? 3.7 : 0), w, 5, d, 0x1a2c50);
    box(x + (along === "x" ? 0 : 3.7), z + (along === "x" ? 3.7 : 0), w, 5, d, 0x1a2c50);
    box(x, z, along === "x" ? 0.6 : 8, 1, along === "x" ? 8 : 0.6, 0x24365a).position.y = 5.4;
  }

  function buildDistrict(tint) {
    const SKY = tint === "cool" ? 0x0b1830 : tint === "warm" ? 0x12203f : 0x0d1d3c;
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 9, 52);
    scene.add(new THREE.HemisphereLight(0x9fb3de, 0x0a1220, 1.0));
    const d = new THREE.DirectionalLight(0xffe6a8, 0.5); d.position.set(-8, 16, 6); scene.add(d);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 12), new THREE.MeshBasicMaterial({ color: 0xf7e6a8 }));
    moon.position.set(26, 22, -52); scene.add(moon);
    seed = 7;

    // ground + street strips
    box(0, 0, 60, 0.1, 60, 0x0f1d38).position.y = -0.05;
    const street = new THREE.MeshLambertMaterial({ color: 0x1b3157 });
    const sv = new THREE.Mesh(new THREE.PlaneGeometry(8, 60), street); sv.rotation.x = -Math.PI / 2; sv.position.y = 0.02; scene.add(sv);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(60, 8), street); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; scene.add(sh);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(6, 24), new THREE.MeshLambertMaterial({ color: 0x203a63 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.03; scene.add(plaza);

    // four solid city blocks around the plaza (streets are the gaps)
    block(-11, -11, 7, 7); block(11, -11, 7, 7); block(-11, 11, 7, 7); block(11, 11, 7, 7);
    // outer backdrop ring (non-walkable beyond bounds, no colliders needed — bounds clamp)
    for (let a = 0; a < Math.PI * 2; a += 0.5) box(Math.cos(a) * 28, Math.sin(a) * 28, 4, 5 + rnd() * 8, 4, wallC[(a * 3 | 0) % 4]);

    // fountain in the plaza (small collider)
    box(0, 0, 2.2, 0.6, 2.2, 0x24406a).position.y = 0.3;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 14), new THREE.MeshBasicMaterial({ color: 0x3fb7b7, transparent: true, opacity: 0.7 }));
    water.position.y = 0.7; scene.add(water);
    colliders.push({ x: 0, z: 0, hx: 1.2, hz: 1.2 });

    // lamps along the streets + gateways at the three explored entrances
    lamp(3.3, 6); lamp(-3.3, -6); lamp(6, 3.3); lamp(-6, -3.3); lamp(3.3, -6); lamp(-3.3, 6);
    gateway(0, -19, "x"); gateway(19, 0, "z"); gateway(-19, 0, "z");
  }

  function addMarker(kind, key, label, x, z, color) {
    const g = new THREE.Group();
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.4, 8), new THREE.MeshBasicMaterial({ color }));
    pillar.position.y = 1.2; g.add(pillar);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    glow.position.y = 2.6; g.add(glow);
    g.position.set(x, 0, z); scene.add(g);
    const el = document.createElement("div"); el.className = "wlabel " + kind; el.textContent = label;
    labelLayer.appendChild(el);
    interactables.push({ kind, key, group: g, glow, el, label, pos: g.position });
  }

  function load(chapter, callbacks) {
    ensure(); cbs = callbacks || {}; focus = false;
    revealAll = chapter.difficulty === "easy";
    revealDist = chapter.difficulty === "hard" ? 7 : 15;
    clearScene(); buildDistrict(chapter.tint);
    addMarker("teacher", "__teacher", chapter.teacher.name, 0, -15, 0xf2cd6a);
    const slots = [[15, 0], [-15, 0], [0, -6], [0, 15]];   // east street, west street, plaza-north, south street
    chapter.clues.forEach((cl, i) => {
      const s = slots[i] || [i % 2 ? 6 : -6, 6];
      addMarker("clue", cl.key, cl.hint, s[0], s[1], cl.decoy ? 0xe88a5a : 0x3fb7b7);
    });
    player.pos.set(0, 1.6, 22); player.yaw = 0; player.pitch = 0;
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

  // circle-vs-AABB, axis-separated so the player slides along walls
  function step(nx, nz) {
    for (const b of colliders)
      if (Math.abs(nx - b.x) < b.hx + PR && Math.abs(player.pos.z - b.z) < b.hz + PR)
        nx = b.x + (nx >= b.x ? 1 : -1) * (b.hx + PR);
    player.pos.x = clamp(nx, -BOUND, BOUND);
    for (const b of colliders)
      if (Math.abs(player.pos.x - b.x) < b.hx + PR && Math.abs(nz - b.z) < b.hz + PR)
        nz = b.z + (nz >= b.z ? 1 : -1) * (b.hz + PR);
    player.pos.z = clamp(nz, -BOUND, BOUND);
  }

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
        const sp = 3.8;
        step(player.pos.x + (mx / ml) * sp * dt, player.pos.z + (mz / ml) * sp * dt);
      }
    }
    camera.position.copy(player.pos);
    camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;

    current = null; let best = 3.3;
    for (const t of interactables) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z, d = Math.hypot(dx, dz);
      proj.set(t.pos.x, 2.9, t.pos.z).project(camera);
      if (proj.z < 1) {
        const showable = revealAll || focus || t.kind === "teacher" || d < revealDist;
        t.el.style.display = showable ? "block" : "none";
        t.el.style.left = (proj.x * 0.5 + 0.5) * innerWidth + "px";
        t.el.style.top = (-proj.y * 0.5 + 0.5) * innerHeight + "px";
        t.el.style.opacity = Math.max(0.25, 1 - d / 30);
      } else t.el.style.display = "none";
      if (!paused && d < best) { best = d; current = t; }
      t.glow.position.y = 2.6 + Math.sin(now / 400 + t.pos.z) * 0.12;
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
