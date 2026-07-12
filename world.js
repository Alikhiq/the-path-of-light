/*
  The Path of Light — walkable prototype engine (Three.js r128, no modules).
  Retro low-poly Baghdad street. First-person movement + walk-up interaction.
  Reuses chapter 1 content from content.js for the teacher + clue text.
*/
(() => {
  "use strict";
  const CH = (window.CONTENT && window.CONTENT.chapters[0]) || { clues: [], teacher: { name: "Ustadha Maryam" }, intro: [{ text: "" }] };

  const canvas = document.getElementById("c");
  const labelLayer = document.getElementById("label-layer");
  const promptEl = document.getElementById("prompt");
  const promptText = document.getElementById("promptText");
  const actBtn = document.getElementById("act");
  const objEl = document.getElementById("obj");
  const insightEl = document.getElementById("insight");
  const evEl = document.getElementById("ev");
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // ---------------------------------------------------------------- three
  const scene = new THREE.Scene();
  const SKY = 0x0d1d3c;
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 6, 34);

  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 120);
  camera.rotation.order = "YXZ";

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(0.62);              // chunky retro pixels
  function size() {
    const w = innerWidth || document.documentElement.clientWidth || 800;
    const h = innerHeight || document.documentElement.clientHeight || 600;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  size();

  scene.add(new THREE.HemisphereLight(0x8ea6d6, 0x0a1220, 0.9));
  const dir = new THREE.DirectionalLight(0xffe6a8, 0.6);
  dir.position.set(-6, 14, 4);
  scene.add(dir);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf7e6a8 }));
  moon.position.set(22, 20, -40);
  scene.add(moon);

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 80),
    new THREE.MeshLambertMaterial({ color: 0x11213c })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  // street path (lighter strip)
  const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshLambertMaterial({ color: 0x1a2f52 }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, -8);
  scene.add(path);

  // buildings — two rows outside the corridor
  const wallColors = [0x14284a, 0x102544, 0x1a2c50, 0x0f2140];
  const winMat = new THREE.MeshBasicMaterial({ color: 0xf2cd6a });
  function building(x, z, w, h, d) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: wallColors[(Math.abs(x + z) | 0) % wallColors.length] }));
    b.position.set(x, h / 2, z);
    scene.add(b);
    // window dots
    const rows = Math.min(4, Math.floor(h / 2));
    for (let r = 0; r < rows; r++) for (let c = -1; c <= 1; c++) {
      if ((r + c + (z | 0)) % 2 === 0) continue;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
      win.position.set(x + (x < 0 ? w / 2 + 0.01 : -w / 2 - 0.01), 1.4 + r * 1.7, z + c * 1.2);
      win.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(win);
    }
  }
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let z = 10; z >= -24; z -= 4.4) {
    const hL = 4 + rnd() * 7, hR = 4 + rnd() * 7;
    building(-6 - rnd() * 2, z, 3 + rnd() * 2, hL, 3.6);
    building(6 + rnd() * 2, z, 3 + rnd() * 2, hR, 3.6);
  }
  // a couple of market stalls / crates in the corridor edges
  function crate(x, z, s, col) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: col }));
    m.position.set(x, s / 2, z); scene.add(m);
  }
  crate(-2.6, 2, 1, 0x6b4a2a); crate(-2.1, 1.2, 0.7, 0x7a5630);
  crate(2.6, -3, 1, 0x2f6a5a); crate(2.4, -16, 1.1, 0x6b4a2a);

  // ---------------------------------------------------------- interactables
  const interactables = [];
  function marker(kind, key, label, x, z, color) {
    const g = new THREE.Group();
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 2.2, 8),
      new THREE.MeshBasicMaterial({ color }));
    pillar.position.y = 1.1; g.add(pillar);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    glow.position.y = 2.4; g.add(glow);
    g.position.set(x, 0, z);
    scene.add(g);
    const el = document.createElement("div");
    el.className = "wlabel " + kind;
    el.textContent = label;
    labelLayer.appendChild(el);
    interactables.push({ kind, key, label, group: g, glow, el, pos: g.position, found: false });
  }
  marker("teacher", "__teacher", CH.teacher.name, 0, -15, 0xf2cd6a);
  const spots = [[-2.2, -3], [2.4, -8], [-2.6, -12]];
  CH.clues.forEach((cl, i) => {
    const s = spots[i] || [0, -6 - i * 3];
    marker("clue", cl.key, cl.hint, s[0], s[1], 0x3fb7b7);
  });

  // ---------------------------------------------------------------- state
  const player = { pos: new THREE.Vector3(0, 1.6, 9), yaw: 0, pitch: 0 };
  const CORRIDOR = 3.4, ZMIN = -18.5, ZMAX = 11;
  let insight = 0; const found = new Set();
  const need = CH.clues.length;

  function updateHud() {
    insightEl.textContent = insight;
    evEl.textContent = found.size + "/" + need;
    if (found.size >= need) objEl.innerHTML = "Evidence gathered — return to <b>" + CH.teacher.name + "</b>";
  }

  function interact(t) {
    if (t.kind === "clue") {
      if (!t.found) {
        t.found = true; found.add(t.key); insight += 10;
        t.el.classList.add("done"); t.glow.material.opacity = 0.1;
        const cl = CH.clues.find(c => c.key === t.key) || {};
        showSheet("Evidence · Insight +10", cl.title || t.label, cl.copy || "");
        updateHud();
      } else showSheet("Evidence", t.label, "Already recorded in your casebook.");
    } else { // teacher
      if (found.size < need) {
        showSheet("Ustadha Maryam", CH.teacher.name, (CH.intro[0] && CH.intro[0].text) || "Find the three clues in the street, then return to me.");
      } else {
        insight += 40; updateHud();
        showSheet("Case resolved · Insight +40", "Well done", "You traced the folio, the mark, and the seal. Record the evidence and consult qualified scholars — never place words on the Imams without proof. (Full branching dialogue lives in the main game.)");
        objEl.innerHTML = "Chapter complete — <b>walk freely</b>";
      }
    }
  }

  // ---------------------------------------------------------------- sheet
  const sheet = document.getElementById("sheet");
  function showSheet(eye, title, body) {
    document.getElementById("sheetEye").textContent = eye;
    document.getElementById("sheetTitle").textContent = title;
    document.getElementById("sheetBody").textContent = body;
    sheet.classList.add("show");
    document.exitPointerLock && document.exitPointerLock();
  }
  document.getElementById("sheetClose").onclick = () => sheet.classList.remove("show");

  // ---------------------------------------------------------------- input
  const keys = {};
  addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "e" && current) interact(current);
  });
  addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

  // desktop mouse look via pointer lock
  let locked = false;
  canvas.addEventListener("click", () => { if (!isTouch && !sheet.classList.contains("show")) canvas.requestPointerLock(); });
  document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === canvas; });
  document.addEventListener("mousemove", e => {
    if (!locked) return;
    player.yaw -= e.movementX * 0.0022;
    player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - e.movementY * 0.0022));
  });

  // touch: joystick move + drag look + act button
  const joy = { active: false, id: -1, cx: 0, cy: 0, dx: 0, dy: 0 };
  const lookT = { id: -1, x: 0, y: 0 };
  if (isTouch) {
    document.getElementById("touch").style.display = "block";
    document.getElementById("hint").style.display = "none";
    const knob = document.getElementById("knob");
    const joyEl = document.getElementById("joy");
    joyEl.addEventListener("touchstart", e => {
      const t = e.changedTouches[0]; const r = joyEl.getBoundingClientRect();
      joy.active = true; joy.id = t.identifier; joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2;
    }, { passive: true });
    addEventListener("touchmove", e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joy.id && joy.active) {
          let dx = t.clientX - joy.cx, dy = t.clientY - joy.cy;
          const m = Math.hypot(dx, dy), max = 48; if (m > max) { dx *= max / m; dy *= max / m; }
          joy.dx = dx / max; joy.dy = dy / max;
          knob.style.transform = `translate(${dx}px,${dy}px)`;
        } else if (t.identifier === lookT.id) {
          player.yaw -= (t.clientX - lookT.x) * 0.006;
          player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - (t.clientY - lookT.y) * 0.006));
          lookT.x = t.clientX; lookT.y = t.clientY;
        }
      }
    }, { passive: true });
    addEventListener("touchstart", e => {
      const t = e.changedTouches[0];
      if (t.clientX > innerWidth / 2 && lookT.id === -1 && t.target.id !== "act") { lookT.id = t.identifier; lookT.x = t.clientX; lookT.y = t.clientY; }
    }, { passive: true });
    addEventListener("touchend", e => {
      for (const t of e.changedTouches) {
        if (t.identifier === joy.id) { joy.active = false; joy.id = -1; joy.dx = joy.dy = 0; knob.style.transform = ""; }
        if (t.identifier === lookT.id) lookT.id = -1;
      }
    }, { passive: true });
    actBtn.addEventListener("touchstart", e => { e.preventDefault(); if (current) interact(current); });
  }

  // start overlay
  document.getElementById("startBtn").onclick = () => {
    document.getElementById("start").style.display = "none";
    if (!isTouch) canvas.requestPointerLock();
  };

  addEventListener("resize", size);

  // ---------------------------------------------------------------- loop
  let current = null, last = performance.now ? performance.now() : 0;
  const proj = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) || 0.016; last = now;
    if (canvas.width === 0) size();

    // movement input
    let ix = 0, iy = 0;
    if (keys["w"] || keys["arrowup"]) iy += 1;
    if (keys["s"] || keys["arrowdown"]) iy -= 1;
    if (keys["a"] || keys["arrowleft"]) ix -= 1;
    if (keys["d"] || keys["arrowright"]) ix += 1;
    if (joy.active) { ix += joy.dx; iy -= joy.dy; }
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
    let mx = fx * iy + rx * ix, mz = fz * iy + rz * ix;
    const ml = Math.hypot(mx, mz);
    if (ml > 0.001) {
      const speed = 3.4;
      player.pos.x += (mx / ml) * speed * dt;
      player.pos.z += (mz / ml) * speed * dt;
      player.pos.x = Math.max(-CORRIDOR, Math.min(CORRIDOR, player.pos.x));
      player.pos.z = Math.max(ZMIN, Math.min(ZMAX, player.pos.z));
    }

    camera.position.copy(player.pos);
    camera.rotation.y = player.yaw; camera.rotation.x = player.pitch;

    // nearest interactable in range + in front
    current = null; let best = 3.1;
    for (const t of interactables) {
      const dx = t.pos.x - player.pos.x, dz = t.pos.z - player.pos.z;
      const d = Math.hypot(dx, dz);
      // label projection
      proj.set(t.pos.x, 2.6, t.pos.z).project(camera);
      if (proj.z < 1) {
        t.el.style.display = "block";
        t.el.style.left = (proj.x * 0.5 + 0.5) * innerWidth + "px";
        t.el.style.top = (-proj.y * 0.5 + 0.5) * innerHeight + "px";
        t.el.style.opacity = Math.max(0.25, 1 - d / 26);
      } else t.el.style.display = "none";
      if (d < best) { best = d; current = t; }
      // gentle glow bob
      t.glow.position.y = 2.4 + Math.sin(now / 400 + t.pos.z) * 0.12;
    }

    if (current) {
      promptText.textContent = (current.kind === "teacher" ? "Speak with " : "Examine ") + current.label;
      promptEl.style.display = isTouch ? "none" : "flex";
      if (isTouch) { actBtn.style.display = "flex"; actBtn.textContent = current.kind === "teacher" ? "SPEAK" : "EXAMINE"; }
    } else {
      promptEl.style.display = "none";
      if (isTouch) actBtn.style.display = "none";
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  updateHud();
  requestAnimationFrame(frame);
})();
