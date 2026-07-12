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
  let seated = false, eyeY = 1.6, mode = "district";
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
      if (active && !isTouch && !seated && !modalOpen() && canvas.requestPointerLock) canvas.requestPointerLock();
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
    interactables = []; colliders = []; starField = null; halaqaGlows = [];
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
  const WIN_C = [0xf2cd6a, 0xe0aa4f, 0x9adfdf];      // gold · ember · rare teal (lit windows)
  const CLOTH_C = [0x2f6d6d, 0x8a6a2f, 0x1e3a6b];    // muted teal · old gold · lapis (plain cloth awnings)
  let winMats = [], clothMats = [], starField = null, halaqaGlows = [];
  const reducedMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  function seedFrom(value) {
    let hash = 17;
    for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) % 233280;
    return hash || 7;
  }

  function box(x, z, w, h, dep, col) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), new THREE.MeshLambertMaterial({ color: col }));
    b.position.set(x, h / 2, z); scene.add(b); return b;
  }
  // one city block filling an AABB with a cluster of buildings; registers ONE collider
  function block(cx, cz, hx, hz) {
    colliders.push({ x: cx, z: cz, hx, hz });            // ONE collider per block — decoration below cannot affect it
    for (let gx = -hx + 2; gx < hx; gx += 4.2) for (let gz = -hz + 2; gz < hz; gz += 4.2) {
      let h = 4 + rnd() * 8;
      const tower = rnd() < 0.12; if (tower) h += 6 + rnd() * 5;   // a few taller towers (pure decoration)
      const px = cx + gx + (rnd() - 0.5) * 0.55, pz = cz + gz + (rnd() - 0.5) * 0.55;
      const bw = 3 + rnd() * 0.65, bd = 3 + rnd() * 0.65;
      box(px, pz, bw, h, bd, wallC[(Math.abs(px + pz) | 0) % 4]);
      if (tower) box(px, pz, bw * 0.55, 0.5, bd * 0.55, 0x24365a).position.y = h + 0.25;  // dark cap
      const sx = px > 0 ? -1 : 1;                          // same street-facing rule as before
      // window dots — varied: ~30% dark (skipped), gold/ember/rare-teal shared materials
      const rows = Math.min(tower ? 4 : 2, Math.floor(h / 2.4));
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.3) continue;                         // dark window = saved draw call
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.4 + rnd() * 0.2, 0.6 + rnd() * 0.2),
          winMats[rnd() < 0.82 ? (rnd() < 0.5 ? 0 : 1) : 2]);
        win.position.set(px + sx * (bw / 2 + 0.02), 1.4 + r * 1.9, pz);
        win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(win);
      }
      // plain cloth awning on some street-facing walls — above head height, NO collider, NO markings
      if (rnd() < 0.28) {
        const aw = new THREE.Mesh(new THREE.PlaneGeometry(1.5 + rnd() * 0.6, 0.85), clothMats[(rnd() * 3) | 0]);
        aw.position.set(px + sx * (bw / 2 + 0.45), 2.5, pz);
        aw.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        aw.rotation.x = -0.42 * sx;                        // tipped outward like hung cloth
        scene.add(aw);
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

  function libraryLandmark() {
    box(-4.1, -21.7, 3.8, 6.4, 1.1, 0x1e3a6b);
    box(4.1, -21.7, 3.8, 6.4, 1.1, 0x1e3a6b);
    box(0, -21.7, 4.4, 1.15, 1.1, 0x263f6e).position.y = 5.82;
    box(0, -21.08, 4.2, 0.28, 0.12, 0xf2cd6a).position.y = 5.58;
    box(-5.35, -21.05, 0.2, 4.5, 0.2, 0xf2cd6a);
    box(5.35, -21.05, 0.2, 4.5, 0.2, 0xf2cd6a);
    colliders.push({ x: 0, z: -21.7, hx: 6.1, hz: 0.65 });
  }

  function courtLandmark() {
    const stone = new THREE.MeshLambertMaterial({ color: 0x53627e });
    const gold = new THREE.MeshBasicMaterial({ color: 0xf2cd6a });
    for (const x of [-5.2, -2.6, 2.6, 5.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 5.2, 8), stone);
      col.position.set(x, 2.6, -21); scene.add(col);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.18, 8), gold);
      cap.position.set(x, 5.25, -21); scene.add(cap);
      colliders.push({ x, z: -21, hx: 0.42, hz: 0.42 });
    }
    box(0, -21, 12, 0.5, 0.55, 0x263f6e).position.y = 5.7;
  }

  function observatoryLandmark() {
    box(-11, -11, 4.2, 11.5, 4.2, 0x20365f);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x52617d }));
    dome.position.set(-11, 11.5, -11); scene.add(dome);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.22, 12), new THREE.MeshBasicMaterial({ color: 0xf2cd6a }));
    ring.position.set(-11, 11.55, -11); scene.add(ring);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.7, 8), new THREE.MeshLambertMaterial({ color: 0x25304a }));
    scope.position.set(-10.2, 13.2, -10.4); scope.rotation.z = -0.72; scene.add(scope);
  }

  function addLandmark(kind) {
    if (kind === "library") libraryLandmark();
    else if (kind === "court") courtLandmark();
    else if (kind === "observatory") observatoryLandmark();
  }

  // one Points draw call: a faint star shell on the upper hemisphere, inside the camera far plane.
  // fog:false is essential — scene.fog would otherwise erase every star.
  function stars(count) {
    if (!count) return;
    const pos = [], col = [];
    const tints = [new THREE.Color(0xcfd8ea), new THREE.Color(0xf2cd6a), new THREE.Color(0x9adfdf)];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, e = 0.12 + rnd() * 1.3, r = 110 + rnd() * 30; // radius inside far=160
      pos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
      const c = tints[rnd() < 0.86 ? 0 : rnd() < 0.6 ? 1 : 2];
      col.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    starField = new THREE.Points(g, new THREE.PointsMaterial({
      size: 1.5, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0.85, fog: false
    }));
    scene.add(starField);
  }

  function buildDistrict(chapter) {
    const tint = chapter.tint, mood = chapter.mood || {};
    const SKY = tint === "cool" ? 0x0b1830 : tint === "warm" ? 0x12203f : 0x0d1d3c;
    scene.background = new THREE.Color(SKY);
    const horizon = new THREE.Color(SKY).lerp(new THREE.Color(0x24406a), mood.horizonLift ?? 0.3);
    scene.fog = new THREE.Fog(horizon, 11, 58);          // was (SKY, 9, 52) — gentler, lifted horizon glow
    scene.add(new THREE.HemisphereLight(0x9fb3de, 0x0a1220, 1.0)); // light COUNT stays 2 (Hemisphere + Directional)
    const d = new THREE.DirectionalLight(tint === "cool" ? 0xdfe8ff : 0xffe6a8, tint === "cool" ? 0.42 : 0.55);
    d.position.set(-8, 16, 6); scene.add(d);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf7e6a8, fog: false })); // fog:false — moon sits past fog-far
    moon.position.set(26, 22, -52); scene.add(moon);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(5.2, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf7e6a8, transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
    halo.position.copy(moon.position); scene.add(halo);
    seed = seedFrom(chapter.id);                          // deterministic from here — decorative layout is stable per chapter
    winMats = WIN_C.map(c => new THREE.MeshBasicMaterial({ color: c }));                        // recreated per load so
    clothMats = CLOTH_C.map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide })); // clearScene disposes them
    stars(mood.stars ?? 340);

    // ground + street strips
    box(0, 0, 60, 0.1, 60, 0x0f1d38).position.y = -0.05;
    const street = new THREE.MeshLambertMaterial({ color: 0x1b3157 });
    const sv = new THREE.Mesh(new THREE.PlaneGeometry(8, 60), street); sv.rotation.x = -Math.PI / 2; sv.position.y = 0.02; scene.add(sv);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(60, 8), street); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; scene.add(sh);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(6, 24), new THREE.MeshLambertMaterial({ color: 0x203a63, emissive: 0x09121f }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.03; scene.add(plaza);
    // moonlit wet-stone sheen hugging the plaza rim (additive, no z-write)
    const sheen = new THREE.Mesh(new THREE.RingGeometry(5.4, 8.2, 28),
      new THREE.MeshBasicMaterial({ color: 0x3fb7b7, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }));
    sheen.rotation.x = -Math.PI / 2; sheen.position.y = 0.035; scene.add(sheen);

    // four solid city blocks around the plaza (streets are the gaps)
    block(-11, -11, 7, 7); block(11, -11, 7, 7); block(-11, 11, 7, 7); block(11, 11, 7, 7);
    addLandmark(chapter.landmark);
    // outer backdrop ring (non-walkable beyond bounds, no colliders needed — bounds clamp)
    for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const tall = rnd() < 0.22;                          // occasional slender spire (no new meshes)
      box(Math.cos(a) * 28, Math.sin(a) * 28, tall ? 2.2 : 4, tall ? 14 + rnd() * 6 : 5 + rnd() * 8, tall ? 2.2 : 4, wallC[(a * 3 | 0) % 4]);
    }

    // fountain in the plaza (small collider)
    box(0, 0, 2.2, 0.6, 2.2, 0x24406a).position.y = 0.3;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 14), new THREE.MeshBasicMaterial({ color: 0x3fb7b7, transparent: true, opacity: 0.7 }));
    water.position.y = 0.7; scene.add(water);
    colliders.push({ x: 0, z: 0, hx: 1.2, hz: 1.2 });

    // lamps along the streets + gateways at the three explored entrances
    lamp(3.3, 6); lamp(-3.3, -6); lamp(6, 3.3); lamp(-6, -3.3); lamp(3.3, -6); lamp(-3.3, 6);
    gateway(0, -19, "x"); gateway(19, 0, "z"); gateway(-19, 0, "z");
    ambientFigures();                                     // نūر light-beings inhabit the streets — the city is never empty
  }

  function propPart(group, geometry, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz); group.add(mesh); return mesh;
  }

  function addClueProp(group, prop, color) {
    const wood = new THREE.MeshLambertMaterial({ color: 0x6f5234 });
    const paper = new THREE.MeshLambertMaterial({ color: 0xd9c999, side: THREE.DoubleSide });
    const stone = new THREE.MeshLambertMaterial({ color: 0x667086 });
    const clay = new THREE.MeshLambertMaterial({ color: 0x9b6042 });
    const robe = new THREE.MeshLambertMaterial({ color: 0x17233e });
    const accent = new THREE.MeshBasicMaterial({ color });

    if (prop === "stall") {
      propPart(group, new THREE.BoxGeometry(1.7, 0.75, 0.7), wood, 0, 0.38, 0);
      propPart(group, new THREE.BoxGeometry(0.7, 0.55, 0.62), wood, -0.42, 0.92, 0.02, 0, 0, -0.08);
      propPart(group, new THREE.PlaneGeometry(0.7, 0.48), paper, 0.15, 0.86, -0.43, -1.05, 0, 0.08);
      propPart(group, new THREE.PlaneGeometry(0.58, 0.42), paper, 0.54, 0.82, -0.45, -1.05, 0, -0.1);
    } else if (prop === "lectern") {
      propPart(group, new THREE.BoxGeometry(0.22, 1.25, 0.22), wood, 0, 0.63, 0, 0, 0, -0.13);
      propPart(group, new THREE.BoxGeometry(1.05, 0.12, 0.7), wood, 0, 1.25, 0, 0.58, 0, 0);
      propPart(group, new THREE.PlaneGeometry(0.78, 0.48), paper, 0, 1.37, -0.12, -1.02, 0, 0);
      propPart(group, new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), accent, 0, 1.47, -0.34, 0, 0, Math.PI / 2);
    } else if (prop === "pots") {
      propPart(group, new THREE.CylinderGeometry(0.3, 0.42, 0.85, 7), clay, -0.38, 0.43, 0.08);
      propPart(group, new THREE.CylinderGeometry(0.22, 0.34, 0.62, 7), clay, 0.32, 0.31, 0.2);
      propPart(group, new THREE.CylinderGeometry(0.18, 0.28, 0.5, 7), accent, 0.05, 0.25, -0.38);
    } else if (prop === "stele") {
      propPart(group, new THREE.BoxGeometry(1.05, 0.28, 0.68), stone, 0, 0.14, 0);
      propPart(group, new THREE.BoxGeometry(0.72, 1.85, 0.3), stone, 0, 1.15, 0);
      propPart(group, new THREE.BoxGeometry(0.46, 0.08, 0.04), accent, 0, 1.34, -0.17);
      propPart(group, new THREE.BoxGeometry(0.3, 0.08, 0.04), accent, 0, 1.06, -0.17);
    } else if (prop === "figure") {
      // A deliberately featureless hood and tapered robe: never add a face-facing surface.
      propPart(group, new THREE.CylinderGeometry(0.28, 0.62, 1.8, 7), robe, 0, 0.9, 0);
      propPart(group, new THREE.SphereGeometry(0.42, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.72), robe, 0, 1.88, 0);
      propPart(group, new THREE.CylinderGeometry(0.46, 0.5, 0.08, 7), accent, 0, 0.06, 0);
    } else {
      propPart(group, new THREE.BoxGeometry(0.9, 0.85, 0.9), stone, 0, 0.43, 0);
      propPart(group, new THREE.BoxGeometry(0.5, 0.08, 0.94), accent, 0, 0.72, 0);
    }
  }

  function addMarker(kind, key, label, x, z, color, prop) {
    const g = new THREE.Group();
    if (kind === "clue") addClueProp(g, prop, color);
    else {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.4, 8), new THREE.MeshBasicMaterial({ color }));
      pillar.position.y = 1.2; g.add(pillar);
    }
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    glow.position.y = 2.6; g.add(glow);
    g.position.set(x, 0, z); scene.add(g);
    const el = document.createElement("div"); el.className = "wlabel " + kind; el.textContent = label;
    labelLayer.appendChild(el);
    interactables.push({ kind, key, group: g, glow, el, label, pos: g.position });
  }

  /* ---- The Circle of Stillness (halaqa) — a place, not a chapter ---- */
  // An ordinary person rendered as light — faceless, dignified. (Sacred figures
  // are NEVER walkable NPCs; this is the mundane crowd, the game's visual language.)
  function nurFigure(x, z, facing, scale) {
    const g = new THREE.Group();
    const light = new THREE.MeshBasicMaterial({ color: 0xffe6a8 });
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.6, 1.1, 8), light);
    robe.position.y = 0.55; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), light);   // NO face, ever — light only
    head.position.y = 1.2; g.add(head);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf2cd6a, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.position.y = 0.85; g.add(halo);
    halaqaGlows.push({ m: halo, base: 0.15, ph: x + z });          // slow breathing = quiet life
    g.position.set(x, 0, z); g.rotation.y = facing; if (scale) g.scale.setScalar(scale); scene.add(g); return g;
  }

  // A few light-beings standing in the streets so Baghdad is inhabited, never empty.
  // Decoration only: no collider (you pass through light), placed on walkable bands.
  function ambientFigures() {
    const spots = [[3.2, 9], [-3.2, -9], [9, 3.2], [-9, -3.2], [3, -3], [-3, 3], [2.5, 14], [-2.5, -13]];
    for (const s of spots) if (rnd() < 0.62) nurFigure(s[0], s[1], rnd() * Math.PI * 2, 0.9 + rnd() * 0.25);
  }

  function buildHalaqa() {
    scene.background = new THREE.Color(0x0a1424);
    scene.fog = new THREE.Fog(0x14243f, 6, 34);
    scene.add(new THREE.HemisphereLight(0x8ea0c8, 0x0a1018, 0.7));
    const d = new THREE.DirectionalLight(0xffe6a8, 0.3); d.position.set(0, 10, 5); scene.add(d);
    seed = seedFrom("halaqa");
    stars(180);
    box(0, 0, 40, 0.1, 40, 0x0c1626).position.y = -0.05;                          // ground
    const matC = new THREE.Mesh(new THREE.CircleGeometry(4.2, 28), new THREE.MeshLambertMaterial({ color: 0x2a2038, emissive: 0x160c1e }));
    matC.rotation.x = -Math.PI / 2; matC.position.y = 0.02; scene.add(matC);       // warm central mat
    const rim = new THREE.Mesh(new THREE.RingGeometry(4.0, 4.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xf2cd6a, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.03; scene.add(rim);
    const wc = 0x14223c;                                                           // low walls, southern entrance gap
    box(0, -8, 18, 3.2, 0.6, wc); colliders.push({ x: 0, z: -8, hx: 9, hz: 0.35 });
    box(-8, 0, 0.6, 3.2, 18, wc); colliders.push({ x: -8, z: 0, hx: 0.35, hz: 9 });
    box(8, 0, 0.6, 3.2, 18, wc); colliders.push({ x: 8, z: 0, hx: 0.35, hz: 9 });
    box(-5.5, 8, 5, 3.2, 0.6, wc); colliders.push({ x: -5.5, z: 8, hx: 2.5, hz: 0.35 });
    box(5.5, 8, 5, 3.2, 0.6, wc); colliders.push({ x: 5.5, z: 8, hx: 2.5, hz: 0.35 });
    lamp(-7, -7); lamp(7, -7); lamp(-7, 7); lamp(7, 7);
    const N = 6, R = 2.9;                                                          // ring of نūر light-beings
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + 0.35; nurFigure(Math.cos(a) * R, Math.sin(a) * R, -a); }
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffcf7a }));
    flame.position.y = 0.5; scene.add(flame);                                      // central soft flame
    const fhalo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf2cd6a, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
    fhalo.position.y = 0.6; scene.add(fhalo);
    halaqaGlows.push({ m: fhalo, base: 0.1, ph: 2 }, { mesh: flame });
  }

  function addSit(x, z) {
    const el = document.createElement("div"); el.className = "wlabel sit"; el.textContent = "Sit — be still";
    labelLayer.appendChild(el);
    interactables.push({ kind: "sit", key: "__sit", el, label: "the circle", pos: new THREE.Vector3(x, 0, z) });
  }

  function loadHalaqa(callbacks) {
    ensure(); cbs = callbacks || {}; mode = "halaqa"; seated = false; eyeY = 1.6; focus = false; revealAll = true;
    clearScene(); buildHalaqa(); addSit(0, 0);
    player.pos.set(0, 1.6, 6.5); player.yaw = 0; player.pitch = 0;                 // at the entrance, facing the circle
    active = true;
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  // Gate of Wonder: the walkable district with NO markers — pure beholding.
  function loadGate(config) {
    ensure(); cbs = {}; mode = "gate"; seated = false; eyeY = 1.6; focus = false; revealAll = false;
    clearScene(); buildDistrict(config);
    player.pos.set(0, 1.6, 21); player.yaw = 0; player.pitch = 0;   // arrive at the south gate, facing the city
    active = true;
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function setSeated(on) {
    if (seated === on) return;
    seated = on;
    if (on && locked && document.exitPointerLock) document.exitPointerLock();
    if (cbs.onSitChange) cbs.onSitChange(on);
  }

  function load(chapter, callbacks) {
    ensure(); cbs = callbacks || {}; focus = false; mode = "district"; seated = false; eyeY = 1.6;
    revealAll = chapter.difficulty === "easy";
    revealDist = chapter.difficulty === "hard" ? 7 : 15;
    clearScene(); buildDistrict(chapter);
    addMarker("teacher", "__teacher", chapter.teacher.name, 0, -15, 0xf2cd6a);
    const slots = [[15, 0], [-15, 0], [0, -6], [0, 15]];   // east street, west street, plaza-north, south street
    chapter.clues.forEach((cl, i) => {
      const s = slots[i] || [i % 2 ? 6 : -6, 6];
      addMarker("clue", cl.key, cl.hint, s[0], s[1], cl.decoy ? 0xe88a5a : 0x3fb7b7, cl.prop);
    });
    player.pos.set(0, 1.6, 22); player.yaw = 0; player.pitch = 0;
    active = true;
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function unload() {
    active = false; seated = false; eyeY = 1.6; mode = "district";
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
  function fire(t) {
    if (t.kind === "sit") { setSeated(!seated); return; }
    t.kind === "teacher" ? (cbs.onSpeak && cbs.onSpeak()) : (cbs.onExamine && cbs.onExamine(t.key));
  }

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

    if (!paused && !seated) {
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
    eyeY += ((seated ? 0.95 : 1.6) - eyeY) * (reducedMotion ? 1 : Math.min(1, dt * 4));   // camera settles low when seated
    camera.position.set(player.pos.x, eyeY, player.pos.z);
    camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;

    current = null; let best = 3.3;
    for (const t of interactables) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z, d = Math.hypot(dx, dz);
      proj.set(t.pos.x, 2.9, t.pos.z).project(camera);
      if (proj.z < 1) {
        const showable = revealAll || focus || t.kind === "teacher" || t.kind === "sit" || d < revealDist;
        t.el.style.display = showable ? "block" : "none";
        t.el.style.left = (proj.x * 0.5 + 0.5) * innerWidth + "px";
        t.el.style.top = (-proj.y * 0.5 + 0.5) * innerHeight + "px";
        t.el.style.opacity = Math.max(0.25, 1 - d / 30);
      } else t.el.style.display = "none";
      if (!paused && d < best) { best = d; current = t; }
      if (t.glow) t.glow.position.y = 2.6 + Math.sin(now / 400 + t.pos.z) * 0.12;
    }
    if (starField && !reducedMotion) starField.material.opacity = 0.72 + Math.sin(now / 1400) * 0.14;
    if (mode === "halaqa" && !reducedMotion) for (const g of halaqaGlows) {
      if (seated && g.ph !== undefined) g.ph += (0 - g.ph) * dt * 0.033;   // seated: the circle drifts into one shared breath (wordless acknowledgment)
      if (g.m) g.m.material.opacity = g.base * (0.72 + 0.42 * (0.5 + 0.5 * Math.sin(now / 1700 + (g.ph || 0))));
      else if (g.mesh) g.mesh.scale.setScalar(1 + Math.sin(now / 950) * 0.06);
    }

    if (!paused && current && !seated) {
      const isSit = current.kind === "sit";
      promptText.textContent = isSit ? "Sit — be still" : (current.kind === "teacher" ? "Speak with " : "Examine ") + current.label;
      promptEl.style.display = isTouch ? "none" : "flex";
      if (isTouch) { actBtn.style.display = "flex"; actBtn.textContent = isSit ? "SIT" : current.kind === "teacher" ? "SPEAK" : "EXAMINE"; }
    } else {
      promptEl.style.display = "none";
      if (isTouch) actBtn.style.display = "none";
    }
    renderer.render(scene, camera);
  }

  return { load, loadHalaqa, loadGate, unload, setFound, setFocus, rise: () => setSeated(false) };
})();
