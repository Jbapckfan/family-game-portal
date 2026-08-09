(() => {
  const BEST_KEY = "velocity-marble-pro-best-v3";
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
  const CIRCUITS = [
    { id:"kitchen", icon:"🍴", name:"Kitchen Counter", accent:"#ffdd66", medals:[58,72,92], handling:1.08, start:0, end:8, label:"full grand prix · friendly grip" },
    { id:"space", icon:"🪐", name:"Space Station", accent:"#b78cff", medals:[61,77,98], handling:.92, start:0, end:8, label:"full grand prix · low control" },
    { id:"volcano", icon:"🌋", name:"Volcano Run", accent:"#ff633d", medals:[59,74,94], handling:1, start:0, end:8, label:"full grand prix · raw speed" },
    { id:"toyroom", icon:"🧸", name:"Toy Room", accent:"#ff72ca", medals:[62,78,100], handling:1.15, start:0, end:8, label:"full grand prix · precision" },
    { id:"jungle", icon:"🌿", name:"Jungle Temple", accent:"#4dff9a", medals:[60,75,96], handling:.98, start:0, end:8, label:"full grand prix · drift lines" },
    { id:"laundry", icon:"🧺", name:"Washer Factory", accent:"#4ddfff", medals:[57,70,90], handling:1.04, start:0, end:8, label:"full factory grand prix" },
  ];
  let circuitId = localStorage.getItem("velocity-circuit") || "kitchen";
  let profile = localStorage.getItem("velocity-profile") || "Family";
  let practiceCheckpoint = Number(localStorage.getItem("velocity-practice") || 0);
  const circuit = () => CIRCUITS.find(item => item.id === circuitId) || CIRCUITS[0];
  const ghostKey = () => `velocity-ghost-v3:${profile}:${circuitId}`;
  const recordsKey = "velocity-family-records-v3";

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
    #velocity-pro-score { top:148px; right:24px; color:#ffe477; border-color:rgba(255,228,119,.4); }
    #velocity-pro-map { position:absolute; left:18px; bottom:154px; width:190px; height:140px; border:1px solid rgba(0,240,255,.32); border-radius:16px; background:rgba(0,10,22,.58); opacity:0; transition:opacity .2s; }
    #velocity-pro-map.show { opacity:1; }
    #velocity-pro-setup { position:absolute; left:50%; bottom:max(18px,env(safe-area-inset-bottom)); transform:translateX(-50%); width:min(980px,94vw); pointer-events:auto; display:none; padding:12px; border:1px solid rgba(0,240,255,.28); border-radius:18px; background:rgba(1,8,18,.9); backdrop-filter:blur(14px); }
    #velocity-pro-setup.show { display:block; }
    .velocity-circuits { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:6px; }
    .velocity-circuit { border:1px solid rgba(255,255,255,.12); border-radius:11px; padding:7px 4px; color:#aaa; background:rgba(255,255,255,.04); font:700 9px Orbitron,sans-serif; cursor:pointer; min-height:48px; }
    .velocity-circuit.active { border-color:var(--circuit); color:#fff; box-shadow:0 0 16px color-mix(in srgb,var(--circuit) 35%,transparent); }
    .velocity-circuit b,.velocity-circuit small { display:block; }.velocity-circuit b{font-size:10px}.velocity-circuit small{font:600 8px Rajdhani,sans-serif;color:#777;margin-top:2px}
    .velocity-setup-row { display:flex; gap:8px; align-items:center; margin-top:8px; }
    .velocity-setup-row label { color:#8ffaff; font:700 9px Orbitron,sans-serif; }
    .velocity-setup-row input,.velocity-setup-row select { min-width:0; border:1px solid rgba(255,255,255,.14); border-radius:8px; background:#09111d; color:#fff; padding:7px 9px; font:700 10px Orbitron,sans-serif; }
    #velocity-pro-records { margin-left:auto; color:#ffe477; font:700 9px Orbitron,sans-serif; white-space:nowrap; }
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
      #velocity-pro-score { top:190px; right:16px; }
      #velocity-pro-map { width:132px; height:105px; left:10px; bottom:160px; }
      .velocity-circuits { grid-template-columns:repeat(3,minmax(0,1fr)); }
      #velocity-pro-setup { max-height:38vh; overflow:auto; }
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
    <div id="velocity-pro-score" class="pro-chip"></div>
    <canvas id="velocity-pro-map" width="380" height="280" aria-label="Live position ghost map"></canvas>
    <div id="velocity-pro-setup"><div class="velocity-circuits" id="velocity-circuits"></div><div class="velocity-setup-row"><label>RACER</label><input id="velocity-profile" maxlength="14"><label>PRACTICE</label><select id="velocity-practice"><option value="0">Full run</option><option value="1">Sector 2</option><option value="2">Sector 3</option><option value="3">Sector 4</option><option value="4">Sector 5</option><option value="5">Sector 6</option><option value="6">Sector 7</option><option value="7">Final sector</option></select><span id="velocity-pro-records"></span></div></div>
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
    score: document.getElementById("velocity-pro-score"),
    map: document.getElementById("velocity-pro-map"),
    setup: document.getElementById("velocity-pro-setup"),
    records: document.getElementById("velocity-pro-records"),
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
  let runScore = 0;
  let eventCounts = { drift:0, airtime:0, edge:0, landing:0, shortcut:0 };
  let airStarted = 0;
  let lastGrounded = 0;
  let lastSample = 0;
  let runSamples = [];
  let savedGhost = [];
  let sectorStarted = 0;
  let activeBest = null;
  let circuitFinishRequested = false;

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(recordsKey) || "[]"); } catch { return []; }
  }

  function loadGhost() {
    try { return JSON.parse(localStorage.getItem(ghostKey()) || "[]"); } catch { return []; }
  }

  function saveRun(time) {
    if (practiceCheckpoint > 0) return;
    const records = loadRecords();
    const previous = records.filter(r => r.profile===profile && r.circuit===circuitId).sort((a,b)=>a.time-b.time)[0];
    records.push({ profile, circuit:circuitId, time, score:Math.round(runScore), at:Date.now() });
    records.sort((a,b) => a.time-b.time || b.score-a.score);
    localStorage.setItem(recordsKey, JSON.stringify(records.slice(0,60)));
    if (!previous || time <= previous.time) localStorage.setItem(ghostKey(), JSON.stringify(runSamples));
    renderSetup();
  }

  function renderSetup() {
    const holder = document.getElementById("velocity-circuits");
    holder.innerHTML = CIRCUITS.map(item => `<button class="velocity-circuit ${item.id===circuitId?"active":""}" data-circuit="${item.id}" style="--circuit:${item.accent}"><b>${item.icon} ${item.name}</b><small>${item.label}</small></button>`).join("");
    holder.querySelectorAll("[data-circuit]").forEach(button => button.onclick = () => {
      circuitId = button.dataset.circuit;
      localStorage.setItem("velocity-circuit", circuitId);
      window.__velocityHandling = circuit().handling;
      savedGhost = loadGhost();
      practiceCheckpoint = 0;
      localStorage.setItem("velocity-practice", "0");
      renderSetup();
      blip(540,.07,.03);
    });
    const input = document.getElementById("velocity-profile");
    input.value = profile;
    input.onchange = () => { profile=input.value.trim().slice(0,14)||"Family";localStorage.setItem("velocity-profile",profile);savedGhost=loadGhost();renderSetup(); };
    const practice = document.getElementById("velocity-practice");
    practice.value = String(practiceCheckpoint);
    practice.onchange = () => { practiceCheckpoint=Number(practice.value)||0;localStorage.setItem("velocity-practice",String(practiceCheckpoint));renderSetup(); };
    const best = loadRecords().filter(r=>r.profile===profile&&r.circuit===circuitId).sort((a,b)=>a.time-b.time)[0];
    activeBest = best || null;
    ui.records.textContent = `${circuit().icon} ${best?`BEST ${formatTime(best.time)} · ${best.score.toLocaleString()} PTS`:"NO RECORD YET"}`;
  }

  window.__velocityHandling = circuit().handling;
  savedGhost = loadGhost();
  renderSetup();

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

  const CHECKPOINTS = [[0,13,8],[40,-15,-70],[40,-50,-100],[-50,-90,-190],[0,-131,-345],[175,-190,-520],[-120,-275,-465],[-180,-320,-700]];
  let ghostCursor = 0;

  function scoreEvent(label, points) {
    runScore += points;
    show(ui.score, `${label} +${points} · ${Math.round(runScore).toLocaleString()} PTS`, 900);
    blip(620 + Math.min(240, points), .06, .02);
  }

  function distanceFromSectorLine(position, checkpoint) {
    const a=CHECKPOINTS[Math.min(checkpoint,CHECKPOINTS.length-1)],b=CHECKPOINTS[Math.min(checkpoint+1,CHECKPOINTS.length-1)]||a;
    const dx=b[0]-a[0],dz=b[2]-a[2],len=dx*dx+dz*dz||1;
    const t=Math.max(0,Math.min(1,((position[0]-a[0])*dx+(position[2]-a[2])*dz)/len));
    return Math.hypot(position[0]-(a[0]+dx*t),position[2]-(a[2]+dz*t));
  }

  function updateStyleScore(state, now, elapsed) {
    const position=state.position||[0,0,0],velocity=state.velocity||[0,0,0],speed=state.speed||0;
    const cp=Math.min(Number(state.checkpoint)||0,CHECKPOINTS.length-1),a=CHECKPOINTS[cp],b=CHECKPOINTS[Math.min(cp+1,CHECKPOINTS.length-1)]||a;
    const pathX=b[0]-a[0],pathZ=b[2]-a[2],pathLen=Math.hypot(pathX,pathZ)||1;
    const lateral=Math.abs(velocity[0]*(-pathZ/pathLen)+velocity[2]*(pathX/pathLen));
    if(speed>20&&lateral/speed>.46&&now-(eventCounts.drift||0)>620){eventCounts.drift=now;scoreEvent("DRIFT",90)}
    const airborne=Math.abs(velocity[1])>5.2;
    if(airborne&&!airStarted){airStarted=now;scoreEvent("AIRTIME",75)}
    if(!airborne&&airStarted){
      const airTime=now-airStarted;
      if(airTime>330&&Math.abs(velocity[1])<2.2){scoreEvent("PERFECT LANDING",180);eventCounts.landing++}
      airStarted=0;lastGrounded=now;
    }
    const edgeDistance=distanceFromSectorLine(position,cp);
    if(edgeDistance>9&&edgeDistance<18&&!state.recovering&&now-(eventCounts.edge||0)>1200){eventCounts.edge=now;scoreEvent("NEAR EDGE",120)}
    if(now-lastSample>85){runSamples.push({t:Number(elapsed.toFixed(3)),p:position.map(v=>Number(v.toFixed(2))),c:cp});lastSample=now}
  }

  function drawGhostMap(state, elapsed) {
    const canvas=ui.map,context=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
    context.clearRect(0,0,w,h);context.fillStyle="rgba(2,10,22,.82)";context.fillRect(0,0,w,h);
    const map=pos=>[w*.5+pos[0]*.85,18+(-pos[2]+8)*.24];
    context.strokeStyle="rgba(70,220,255,.32)";context.lineWidth=10;context.lineCap="round";context.beginPath();
    CHECKPOINTS.forEach((point,i)=>{const [x,y]=map(point);i?context.lineTo(x,y):context.moveTo(x,y)});context.stroke();
    context.strokeStyle=circuit().accent;context.lineWidth=2;context.stroke();
    while(ghostCursor+1<savedGhost.length&&savedGhost[ghostCursor+1].t<=elapsed)ghostCursor++;
    const ghost=savedGhost[ghostCursor];
    if(ghost?.p){const [x,y]=map(ghost.p);context.fillStyle="rgba(210,160,255,.38)";context.beginPath();context.arc(x,y,12,0,Math.PI*2);context.fill();context.strokeStyle="#d8a7ff";context.lineWidth=2;context.stroke()}
    if(state.position){const [x,y]=map(state.position);context.fillStyle="#fff";context.shadowBlur=16;context.shadowColor=circuit().accent;context.beginPath();context.arc(x,y,8,0,Math.PI*2);context.fill();context.shadowBlur=0}
    context.fillStyle="#8ffaff";context.font="700 19px Orbitron, sans-serif";context.fillText(`${circuit().icon} ${circuit().name.toUpperCase()}`,14,25);
    context.fillStyle="#a88dbe";context.font="700 15px Rajdhani, sans-serif";context.fillText(ghost?"TRANSLUCENT POSITION GHOST":"SET A TIME TO RECORD A GHOST",14,h-13);
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
        runScore = 0;
        eventCounts = { drift:0, airtime:0, edge:0, landing:0, shortcut:0 };
        airStarted = 0;
        lastGrounded = now;
        lastSample = 0;
        runSamples = [];
        savedGhost = loadGhost();
        ghostCursor = 0;
        sectorStarted = now;
        circuitFinishRequested = false;
        const courseStart = practiceCheckpoint > 0 ? practiceCheckpoint : circuit().start;
        if(courseStart>0) setTimeout(()=>window.__velocityStartPractice?.(courseStart),120);
        ui.finish.classList.remove("show");
      }
      const speed = state.speed || 0;
      const elapsed = (now - runStarted) / 1000;
      ui.setup.classList.remove("show");
      ui.map.classList.add("show");
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
        const sectorTime=(now-sectorStarted)/1000;
        lastCheckpoint = state.checkpoint;
        sectorStarted=now;
        combo += 3;
        show(ui.section, `SECTOR ${state.checkpoint + 1} CLEAR`, 1600);
        if(sectorTime<7.4+state.checkpoint*.7){eventCounts.shortcut++;scoreEvent("SHORTCUT LINE",250)}
        blip(360 + state.checkpoint * 90, .12, .04);
        if (practiceCheckpoint === 0 && circuit().end < 8 && state.checkpoint >= circuit().end && !circuitFinishRequested) {
          circuitFinishRequested = true;
          scoreEvent("CIRCUIT GATE", 600);
          setTimeout(() => window.__velocityCompleteRun?.(), 220);
        }
      }
      const trait = TRAITS[state.marbleId] || "BALANCED";
      show(ui.trait, `${String(state.marbleId || "opal").replace(/_/g, " ").toUpperCase()} · ${trait}`, 900);
      const bestRecord = activeBest;
      if (bestRecord) show(ui.ghost, `GHOST ${elapsed>=bestRecord.time?"+":"−"}${formatTime(Math.abs(elapsed - bestRecord.time))} · ${profile.toUpperCase()}`, 1000);
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
      updateStyleScore(state,now,elapsed);
      drawGhostMap(state,elapsed);
      if (state.finishPulse && state.finishPulse !== lastFinish) {
        lastFinish = state.finishPulse;
        const time = elapsed;
        const previous = Number(localStorage.getItem(BEST_KEY) || 0);
        if (!previous || time < previous) localStorage.setItem(BEST_KEY, String(time));
        const targets=circuit().medals,medal = time < targets[0] ? "GOLD" : time < targets[1] ? "SILVER" : time < targets[2] ? "BRONZE" : "FINISHER";
        scoreEvent("FINISH",1000+Math.round(Math.max(0,targets[2]-time)*80));
        saveRun(time);
        ui.medal.textContent = `${circuit().icon} ${medal} · ${formatTime(time)} · ${Math.round(runScore).toLocaleString()} PTS`;
        confetti();
        ui.finish.classList.add("show");
        blip(880, .28, .06);
      }
    } else if (state.gameState === "FINISHED") {
      ui.speedlines.style.opacity = "0";
      ui.map.classList.remove("show");
      runStarted = 0;
    } else if (state.gameState === "MENU") {
      runStarted = 0;
      ui.setup.classList.add("show");
      ui.map.classList.remove("show");
      ui.finish.classList.remove("show");
      ui.speedlines.style.opacity = "0";
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
