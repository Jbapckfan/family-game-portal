(() => {
  const BEST_KEY = "velocity-marble-pro-best";
  const TRAITS = {
    opal: "BALANCED",
    black_bone: "HEAVY ROLLER",
    amazonia: "AGILE",
    clear_crystal: "BOUNCY",
    red_crystal: "BOOST CHARGED",
    auspicious_jade: "GRIP MASTER",
    pink_crystal: "AIR DANCER",
    blue_point_stone: "STEADY",
    granite: "ANCHOR",
    white_turquoise: "SAFE LANDINGS",
    green_aventurine: "SPRINTER",
    smoky_quartz: "DRIFT KING",
  };

  const style = document.createElement("style");
  style.textContent = `
    #velocity-pro-layer { position:fixed; inset:0; z-index:45; pointer-events:none; font-family:Rajdhani,sans-serif; color:#fff; }
    #velocity-pro-layer .pro-chip { position:absolute; padding:6px 10px; border:1px solid rgba(0,240,255,.35); border-radius:999px; background:rgba(0,15,30,.55); color:#8ffaff; font:700 11px Orbitron,sans-serif; letter-spacing:1px; text-shadow:0 0 8px #00eaff; opacity:0; transform:translateY(-5px); transition:opacity .2s,transform .2s; }
    #velocity-pro-layer .pro-chip.show { opacity:1; transform:none; }
    #velocity-pro-combo { top:112px; right:24px; }
    #velocity-pro-section { top:148px; left:50%; transform:translateX(-50%) translateY(-5px); }
    #velocity-pro-section.show { transform:translateX(-50%); }
    #velocity-pro-trait { top:112px; left:24px; }
    #velocity-pro-ghost { bottom:155px; left:50%; transform:translateX(-50%); color:#d7a8ff; border-color:rgba(215,168,255,.45); text-shadow:0 0 8px #9b5cff; white-space:nowrap; }
    #velocity-pro-shield { bottom:205px; left:50%; transform:translateX(-50%) translateY(5px); color:#bff; border-color:#00eaff; }
    #velocity-pro-shield.show { transform:translateX(-50%); }
    #velocity-pro-camera { top:112px; left:50%; transform:translateX(-50%) translateY(-5px); white-space:nowrap; }
    #velocity-pro-camera.show { transform:translateX(-50%); }
    #velocity-pro-speedlines { position:absolute; inset:0; opacity:0; background:radial-gradient(ellipse at center,transparent 35%,rgba(0,220,255,.08) 60%,transparent 75%); mix-blend-mode:screen; transition:opacity .12s; }
    #velocity-pro-finish { position:absolute; inset:0; display:grid; place-items:center; opacity:0; transition:opacity .25s; background:radial-gradient(circle,rgba(0,255,200,.22),transparent 60%); }
    #velocity-pro-finish.show { opacity:1; }
    #velocity-pro-finish strong { font:900 clamp(36px,8vw,90px) Orbitron,sans-serif; letter-spacing:8px; color:#aff; text-shadow:0 0 14px #0ff,0 0 40px #09f; }
    #velocity-pro-medal { display:block; margin-top:14px; color:#ffdd66; font:700 14px Orbitron,sans-serif; letter-spacing:2px; text-align:center; }
    #velocity-pro-confetti { position:absolute; inset:0; overflow:hidden; }
    #velocity-pro-confetti i { position:absolute; top:-10%; width:7px; height:16px; background:#0ff; animation:velocity-confetti 1.8s ease-out forwards; }
    @keyframes velocity-confetti { to { transform:translate3d(var(--x),115vh,0) rotate(720deg); opacity:0; } }
    @media (max-width:600px) {
      #velocity-pro-combo { top:154px; right:16px; }
      #velocity-pro-section { top:190px; }
      #velocity-pro-trait { top:154px; left:16px; }
      #velocity-pro-ghost { bottom:150px; }
      #velocity-pro-shield { bottom:215px; }
      #velocity-pro-camera { top:198px; }
    }
  `;
  document.head.appendChild(style);

  const layer = document.createElement("div");
  layer.id = "velocity-pro-layer";
  layer.innerHTML = `
    <div id="velocity-pro-speedlines"></div>
    <div id="velocity-pro-combo" class="pro-chip"></div>
    <div id="velocity-pro-section" class="pro-chip"></div>
    <div id="velocity-pro-trait" class="pro-chip"></div>
    <div id="velocity-pro-ghost" class="pro-chip"></div>
    <div id="velocity-pro-shield" class="pro-chip">CHECKPOINT SHIELD</div>
    <div id="velocity-pro-camera" class="pro-chip show">DRAG VIEW · DOUBLE-TAP RESET</div>
    <div id="velocity-pro-finish"><div><strong>FINISH!</strong><span id="velocity-pro-medal"></span></div><div id="velocity-pro-confetti"></div></div>
  `;
  document.body.appendChild(layer);

  const ui = {
    combo: document.getElementById("velocity-pro-combo"),
    section: document.getElementById("velocity-pro-section"),
    trait: document.getElementById("velocity-pro-trait"),
    ghost: document.getElementById("velocity-pro-ghost"),
    shield: document.getElementById("velocity-pro-shield"),
    camera: document.getElementById("velocity-pro-camera"),
    speedlines: document.getElementById("velocity-pro-speedlines"),
    finish: document.getElementById("velocity-pro-finish"),
    medal: document.getElementById("velocity-pro-medal"),
    confetti: document.getElementById("velocity-pro-confetti"),
  };

  let audio;
  let runStarted = 0;
  let lastSpeed = 0;
  let lastCheckpoint = 0;
  let combo = 0;
  let comboClock = 0;
  let lastFinish = 0;
  let lastShield = 0;
  let lastBlip = 0;

  const cameraOrbit = window.__velocityCameraOrbit = window.__velocityCameraOrbit || {
    yaw: 0,
    pitch: 0,
    dragging: false,
  };
  let cameraPointer = null;
  let cameraX = 0;
  let cameraY = 0;

  function resetCameraOrbit() {
    cameraOrbit.yaw = 0;
    cameraOrbit.pitch = 0;
    cameraOrbit.dragging = false;
    show(ui.camera, "CAMERA CENTERED", 1000);
  }

  function isCameraSurface(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("canvas")) return false;
    if (window.__velocityProState?.gameState !== "PLAYING") return false;
    if (event.pointerType === "touch" && event.clientY > innerHeight * .58) {
      if (event.clientX < innerWidth * .43 || event.clientX > innerWidth * .64) return false;
    }
    return true;
  }

  document.addEventListener("pointerdown", (event) => {
    if (!isCameraSurface(event) || cameraPointer !== null) return;
    cameraPointer = event.pointerId;
    cameraX = event.clientX;
    cameraY = event.clientY;
    cameraOrbit.dragging = true;
  }, { passive: true });

  document.addEventListener("pointermove", (event) => {
    if (event.pointerId !== cameraPointer) return;
    const deltaX = event.clientX - cameraX;
    const deltaY = event.clientY - cameraY;
    cameraX = event.clientX;
    cameraY = event.clientY;
    if (Math.abs(deltaX) + Math.abs(deltaY) < 1) return;
    cameraOrbit.yaw -= deltaX * .006;
    cameraOrbit.pitch = Math.max(-.45, Math.min(.55, cameraOrbit.pitch - deltaY * .005));
    show(ui.camera, "ORBIT CAMERA · DOUBLE-TAP RESET", 800);
    event.preventDefault();
  }, { passive: false });

  function endCameraDrag(event) {
    if (event.pointerId !== cameraPointer) return;
    cameraPointer = null;
    cameraOrbit.dragging = false;
  }

  document.addEventListener("pointerup", endCameraDrag, { passive: true });
  document.addEventListener("pointercancel", endCameraDrag, { passive: true });
  document.addEventListener("dblclick", (event) => {
    if (event.target instanceof Element && event.target.closest("canvas")) resetCameraOrbit();
  }, { passive: true });

  setTimeout(() => ui.camera.classList.remove("show"), 5000);

  function startAudio() {
    if (audio) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio = new AudioContext();
  }

  function blip(frequency, duration = 0.07, volume = 0.025) {
    if (!audio || audio.state !== "running") return;
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  document.addEventListener("click", () => {
    startAudio();
    if (audio?.state === "suspended") audio.resume();
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") blip(520, .09, .035);
    if (event.code === "KeyC") resetCameraOrbit();
  }, { passive: true });

  function show(chip, text, duration = 1200) {
    chip.textContent = text;
    chip.classList.add("show");
    clearTimeout(chip.__hide);
    chip.__hide = setTimeout(() => chip.classList.remove("show"), duration);
  }

  function confetti() {
    ui.confetti.textContent = "";
    for (let i = 0; i < 28; i += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = ["#00f0ff", "#fff", "#ffdd00", "#ff55cc"][i % 4];
      bit.style.setProperty("--x", `${(Math.random() - .5) * 220}px`);
      bit.style.animationDelay = `${Math.random() * .25}s`;
      ui.confetti.appendChild(bit);
    }
  }

  function formatTime(seconds) {
    return `${seconds.toFixed(1)}s`;
  }

  function readState() {
    const state = window.__velocityProState;
    if (state) return state;
    const diagnostics = window.__velocityDiagnostics;
    if (!diagnostics) return null;
    return { gameState: "PLAYING", speed: Math.hypot(...diagnostics.velocity.current), checkpoint: diagnostics.checkpoint(), marbleId: "opal" };
  }

  function tick(now) {
    const state = readState();
    if (!state) {
      requestAnimationFrame(tick);
      return;
    }
    if (state.gameState === "PLAYING") {
      if (!runStarted) {
        runStarted = now;
        combo = 0;
        lastCheckpoint = state.checkpoint || 0;
        ui.finish.classList.remove("show");
      }
      const speed = state.speed || 0;
      const elapsed = (now - runStarted) / 1000;
      const normalized = Math.min(speed / 60, 1);
      ui.speedlines.style.opacity = `${normalized * .55}`;
      if (speed > 16) {
        combo = Math.max(combo, 1) + (speed > 34 ? .012 : .004);
        comboClock = now;
        show(ui.combo, `FLOW COMBO x${Math.floor(combo)}`, 500);
      } else if (combo > 0 && now - comboClock > 1700) {
        combo = 0;
        ui.combo.classList.remove("show");
      }
      if (state.checkpoint > lastCheckpoint) {
        lastCheckpoint = state.checkpoint;
        combo += 3;
        show(ui.section, `SECTOR ${state.checkpoint + 1} CLEAR`, 1600);
        blip(360 + state.checkpoint * 90, .12, .04);
      }
      const trait = TRAITS[state.marbleId] || "BALANCED";
      show(ui.trait, `${String(state.marbleId || "opal").replace(/_/g, " ").toUpperCase()} · ${trait}`, 900);
      const best = Number(localStorage.getItem(BEST_KEY) || 0);
      if (best > 0) show(ui.ghost, `GHOST ${formatTime(elapsed - best)} · BEST ${formatTime(best)}`, 1000);
      if (state.recovering && now - lastShield > 500) {
        lastShield = now;
        show(ui.shield, "CHECKPOINT SHIELD", 850);
        blip(260, .16, .035);
      }
      if (speed > 30 && now - lastBlip > 500) {
        lastBlip = now;
        blip(180 + speed * 5, .045, .012);
      }
      lastSpeed = speed;
      if (state.finishPulse && state.finishPulse !== lastFinish) {
        lastFinish = state.finishPulse;
        const time = elapsed;
        const previous = Number(localStorage.getItem(BEST_KEY) || 0);
        if (!previous || time < previous) localStorage.setItem(BEST_KEY, String(time));
        const medal = time < 22 ? "GOLD" : time < 34 ? "SILVER" : "BRONZE";
        ui.medal.textContent = `${medal} MEDAL · ${formatTime(time)}`;
        confetti();
        ui.finish.classList.add("show");
        blip(880, .28, .06);
      }
    } else if (state.gameState === "FINISHED") {
      ui.speedlines.style.opacity = "0";
    } else if (state.gameState === "MENU") {
      runStarted = 0;
      ui.finish.classList.remove("show");
      ui.speedlines.style.opacity = "0";
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
