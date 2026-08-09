(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: true });
  const $ = selector => document.querySelector(selector);
  const screens = ["#menu", "#how", "#countdown", "#results", "#leaderboard", "#settings"];
  const COLORS = ["#ffe14d", "#22d3ee", "#ff3d9a", "#8b5cf6", "#36f59d", "#ff884d"];
  const SILLY_PRAISE = ["TURBO PICKLE!", "FINGER WIZARD!", "ZOOM NOODLE!", "ABSURDLY QUICK!", "MEGA BONK!", "BANANA SPEED!", "HANDS = LIGHTNING", "CHAOS CHAMPION!"];
  const SILLY_MISS = ["WHOOPS-A-DOODLE", "ESCAPED!", "TOO SNEAKY!", "BUTTERFINGERS!", "RUDE LITTLE THING!", "COME BACK HERE!"];

  const ui = {
    hud: $("#hud"), score: $("#score"), time: $("#time"), combo: $("#combo"),
    fever: $("#fever-fill"), hearts: $("#hearts"), mode: $("#mode-chip"),
    menu: $("#menu"), how: $("#how"), countdown: $("#countdown"), results: $("#results"),
    countdownNumber: $("#countdown-number"), countdownTip: $("#countdown-tip"), roundLabel: $("#round-label"),
    toast: $("#toast"), best: $("#best-score"), sound: $("#sound-button"), soundState: $("#sound-state"),
    resultScore: $("#result-score"), resultRank: $("#result-rank"), resultKicker: $("#result-kicker"),
    bestCombo: $("#stat-best-combo"), accuracy: $("#stat-accuracy"), statBest: $("#stat-best"), duelResult: $("#duel-result"),
    nameEntry: $("#name-entry"), recordName: $("#record-name"), scoreRecords: $("#score-records"), reactionRecords: $("#reaction-records")
  };

  let W = innerWidth;
  let H = innerHeight;
  let dpr = Math.min(devicePixelRatio || 1, 2);
  let now = performance.now();
  let last = now;
  let audio = null;
  let muted = localStorage.getItem("reflexRiotMuted") === "true";
  let animationId = 0;
  let toastTimer = 0;
  let pendingRecord = null;
  let settings = readJson("reflexRiotSettings", { level:"normal", skin:"neon", reduceFlash:false, largeTargets:false, symbolCues:false, oneHand:false, calibration:0, totalScore:0 });

  const state = {
    screen: "menu", playing: false, gameKind: "solo", duelRound: 1, duelScores: [],
    score: 0, combo: 0, maxCombo: 0, hits: 0, attempts: 0, shields: 3, maxShields:3,
    duration: 60, remaining: 60, startedAt: 0, lastModeAt: 0, modeIndex: 0,
    mode: "sticks", modeIntroUntil: 0, spawnAt: 0, difficulty: 1, fever: 0, feverUntil: 0,
    freezeGreen: true, freezeChangeAt: 0, shake: 0, flash: 0, bgHue: 245,
    entities: [], particles: [], floaters: [], ripples: [], stars: [],
    pointer: null, paused: false, numberTarget:1, reactionReadyAt:0, reactionBorn:0, reactionTrials:[], calibrating:false
  };

  const MODES = {
    sticks: { name: "STICK SNATCH", icon: "🟡", tip: "GRAB THE FALLING STICKS!", color: "#ffe14d" },
    smash: { name: "SMASH PARTY", icon: "💥", tip: "SMASH SPARKS — DODGE BOMBS!", color: "#ff3d9a" },
    swipe: { name: "SWIPE STORM", icon: "👆", tip: "SWIPE WITH THE ARROWS!", color: "#22d3ee" },
    freeze: { name: "GO / FREEZE", icon: "🟢", tip: "GREEN = TAP · RED = FREEZE", color: "#36f59d" },
    color: { name: "COLOR MATCH", icon: "🎨", tip: "TAP WHEN WORD + COLOR MATCH!", color: "#ff884d" },
    number: { name: "NUMBER ORDER", icon: "🔢", tip: "TAP 1 · 2 · 3!", color: "#8b5cf6" },
    hold: { name: "PERFECT HOLD", icon: "⏱", tip: "HOLD UNTIL THE RING IS GREEN!", color: "#22d3ee" },
    star: { name: "STAR HUNT", icon: "⭐", tip: "FIND THE ONE STAR!", color: "#ffe14d" }
  };
  const MODE_ORDER = ["sticks", "smash", "swipe", "freeze", "color", "number", "hold", "star"];
  const LEVELS = { kid:{duration:50,shields:5,speed:.72,size:1.28}, normal:{duration:60,shields:3,speed:1,size:1}, riot:{duration:70,shields:2,speed:1.3,size:.88} };
  const SKINS = { neon:0, candy:2500, space:9000, gold:22000 };

  function readJson(key, fallback) { try { return { ...fallback, ...JSON.parse(localStorage.getItem(key)||"{}") }; } catch (_) { return { ...fallback }; } }
  function readBoard(key) { try { const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]; } catch (_) { return []; } }
  function saveSettings() { localStorage.setItem("reflexRiotSettings",JSON.stringify(settings)); applySettings(); }
  function applySettings(){document.body.dataset.riotSkin=settings.skin;document.body.classList.toggle("reduce-flash",settings.reduceFlash);}

  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.stars = Array.from({ length: Math.min(100, Math.floor(W * H / 12000)) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + .4, speed: Math.random() * 16 + 6, alpha: Math.random() * .5 + .12
    }));
  }

  function showScreen(id) {
    screens.forEach(s => $(s).classList.add("hidden"));
    if (id) $(id).classList.remove("hidden");
  }

  function audioContext() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    return audio;
  }

  function tone(frequency, duration = .09, type = "sine", volume = .08, slide = 0) {
    if (muted) return;
    try {
      const ac = audioContext(); const osc = ac.createOscillator(); const gain = ac.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, ac.currentTime);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), ac.currentTime + duration);
      gain.gain.setValueAtTime(volume, ac.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + duration);
      osc.connect(gain).connect(ac.destination); osc.start(); osc.stop(ac.currentTime + duration);
    } catch (_) { /* Sound is optional. */ }
  }

  function sound(kind) {
    if (kind === "hit") { tone(420 + Math.min(state.combo, 15) * 24, .07, "triangle", .07, 160); }
    if (kind === "pop") { tone(180, .055, "square", .06, 420); }
    if (kind === "bad") { tone(150, .22, "sawtooth", .07, -75); }
    if (kind === "swipe") { tone(280, .12, "triangle", .07, 620); }
    if (kind === "start") { [0, 90, 180].forEach((v, i) => setTimeout(() => tone(360 + v, .12, "square", .055, 180), i * 100)); }
    if (kind === "fever") { [520, 660, 820, 1040].forEach((v, i) => setTimeout(() => tone(v, .2, "sawtooth", .05, 120), i * 65)); }
  }

  function haptic(pattern = 12) {
    if (window.webkit?.messageHandlers?.haptic) window.webkit.messageHandlers.haptic.postMessage(pattern > 20 ? "heavy" : "light");
    else if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function toggleSound() {
    muted = !muted; localStorage.setItem("reflexRiotMuted", String(muted)); updateSound();
    if (!muted) sound("start");
  }

  function updateSound() {
    ui.sound.textContent = muted ? "🔇" : "🔊"; ui.soundState.textContent = muted ? "🔇" : "🔊";
  }

  function bestScore() { return Number(localStorage.getItem("reflexRiotBest") || 0); }
  function setBest(score) { if (score > bestScore()) localStorage.setItem("reflexRiotBest", String(score)); }

  function qualifies(type,value){const board=readBoard(type==="score"?"reflexRiotScoreBoard":"reflexRiotReactionBoard");if(board.length<10)return true;return type==="score"?value>board[board.length-1].value:value<board[board.length-1].value}
  function offerRecord(type,value){if(!qualifies(type,value))return;pendingRecord={type,value};ui.nameEntry.classList.remove("hidden");ui.recordName.value=localStorage.getItem("reflexRiotLastName")||"";setTimeout(()=>ui.recordName.focus(),80)}
  function saveRecord(){if(!pendingRecord)return;const name=(ui.recordName.value.trim()||"Anonymous").slice(0,18),key=pendingRecord.type==="score"?"reflexRiotScoreBoard":"reflexRiotReactionBoard",board=readBoard(key);board.push({name,value:pendingRecord.value,at:Date.now()});board.sort((a,b)=>pendingRecord.type==="score"?b.value-a.value:a.value-b.value);localStorage.setItem(key,JSON.stringify(board.slice(0,10)));localStorage.setItem("reflexRiotLastName",name);pendingRecord=null;ui.nameEntry.classList.add("hidden");renderLeaderboards();showToast("RECORD SAVED!","#36f59d")}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character])}
  function renderLeaderboards(){const scores=readBoard("reflexRiotScoreBoard"),reactions=readBoard("reflexRiotReactionBoard");ui.scoreRecords.innerHTML=scores.length?scores.map(row=>`<li>${escapeHtml(row.name)}<span>${Number(row.value).toLocaleString()}</span></li>`).join(""):"<li>No records yet</li>";ui.reactionRecords.innerHTML=reactions.length?reactions.map(row=>`<li>${escapeHtml(row.name)}<span>${Number(row.value)} ms</span></li>`).join(""):"<li>No records yet</li>"}

  async function countdown(label = "") {
    state.screen = "countdown"; showScreen("#countdown"); ui.hud.classList.add("hidden");
    ui.roundLabel.textContent = label;
    const steps = ["3", "2", "1", "RIOT!"];
    const tips = ["WIGGLE THOSE FINGERS", "EYES OPEN", "NO MERCY", "GO GO GO!"];
    for (let i = 0; i < steps.length; i++) {
      ui.countdownNumber.textContent = steps[i]; ui.countdownTip.textContent = tips[i];
      ui.countdownNumber.style.animation = "none"; void ui.countdownNumber.offsetWidth; ui.countdownNumber.style.animation = "countPop .7s ease both";
      tone(steps[i] === "RIOT!" ? 720 : 320 + i * 110, .16, "square", .055, 120);
      await new Promise(resolve => setTimeout(resolve, i === 3 ? 520 : 650));
    }
  }

  async function startGame(kind = state.gameKind, preserveDuel = false) {
    state.gameKind = kind;
    if (!preserveDuel) { state.duelRound = 1; state.duelScores = []; }
    const label = kind === "duel" ? `PLAYER ${state.duelRound} — YOUR TURN!` : "";
    await countdown(label);
    const profile=LEVELS[settings.level]||LEVELS.normal;
    state.score = 0; state.combo = 0; state.maxCombo = 0; state.hits = 0; state.attempts = 0; state.maxShields=kind==="duel"?3:profile.shields;state.shields=state.maxShields;
    state.duration = kind === "duel" ? 35 : profile.duration; state.remaining = state.duration; state.startedAt = performance.now();
    state.lastModeAt = state.startedAt; state.modeIndex = kind === "duel" && state.duelRound === 2 ? 0 : 0;
    state.entities.length = 0; state.particles.length = 0; state.floaters.length = 0; state.ripples.length = 0;
    state.difficulty = 1; state.fever = 0; state.feverUntil = 0; state.shake = 0; state.flash = 0; state.paused = false;
    state.playing = true; state.screen = "game"; showScreen(null); ui.hud.classList.remove("hidden");
    switchMode(MODE_ORDER[state.modeIndex], true); updateHud(); sound("start");
  }

  function startReaction(calibrating=false){state.gameKind=calibrating?"calibrate":"reaction";state.mode="reaction";state.calibrating=calibrating;state.reactionTrials=[];state.playing=true;state.screen="game";state.entities=[];showScreen(null);ui.hud.classList.add("hidden");scheduleReactionTarget()}
  function scheduleReactionTarget(){state.entities=[];state.reactionBorn=0;state.reactionReadyAt=performance.now()+900+Math.random()*2200;showToast(state.calibrating?`CALIBRATION ${state.reactionTrials.length+1}/3 · WAIT…`:"WAIT FOR IT…","#22d3ee")}
  function finishReaction(milliseconds){state.reactionTrials.push(milliseconds);state.entities=[];if(state.calibrating&&state.reactionTrials.length<3){setTimeout(scheduleReactionTarget,650);return}state.playing=false;const result=state.calibrating?Math.round(state.reactionTrials.reduce((a,b)=>a+b,0)/state.reactionTrials.length):milliseconds;if(state.calibrating){settings.calibration=result;saveSettings()}state.screen="results";showScreen("#results");ui.resultScore.textContent=`${result} ms`;ui.resultKicker.textContent=state.calibrating?"CALIBRATION SAVED":"REACTION COMPLETE";ui.resultRank.textContent=result<180?"⚡ LIGHTNING":result<250?"🔥 BLAZING":result<350?"👍 QUICK HANDS":"🐢 WARMING UP";ui.bestCombo.textContent="1";ui.accuracy.textContent="100%";const board=readBoard("reflexRiotReactionBoard");ui.statBest.textContent=board.length?`${board[0].value} ms`:"—";ui.duelResult.classList.add("hidden");ui.nameEntry.classList.add("hidden");$("#again-button").textContent=state.calibrating?"TRY REACTION MODE":"↻ TRY AGAIN";if(!state.calibrating)offerRecord("reaction",result);renderSettings()}

  function switchMode(mode, first = false) {
    state.mode = mode; state.entities.length = 0; state.spawnAt = now + (first ? 300 : 850); state.lastModeAt = now;
    state.modeIntroUntil = now + 1250; state.freezeGreen = true; state.freezeChangeAt = now + 1300;
    const info = MODES[mode]; ui.mode.textContent = `${info.icon} ${info.name}`; ui.mode.style.background = info.color;
    showToast(first ? info.tip : `${info.icon} ${info.name}!`, info.color);
    state.flash = .35; haptic(22); tone(260, .13, "square", .05, 300);
  }

  function nextMode() {
    state.modeIndex = (state.modeIndex + 1) % MODE_ORDER.length;
    switchMode(MODE_ORDER[state.modeIndex]);
  }

  function updateHud() {
    ui.score.textContent = state.score.toLocaleString(); ui.time.textContent = Math.max(0, Math.ceil(state.remaining));
    const multiplier = state.feverUntil > now ? 3 : Math.min(1 + Math.floor(state.combo / 8), 5);
    ui.combo.textContent = state.feverUntil > now ? `🔥 FEVER x${multiplier}` : `x${multiplier} · ${state.combo} combo`;
    ui.fever.style.width = `${Math.min(100, state.fever)}%`;
    ui.hearts.textContent = Array.from({length: state.maxShields}, (_, i) => i < state.shields ? "●" : "○").join("  ");
    ui.hearts.setAttribute("aria-label", `${state.shields} of ${state.maxShields} shields remaining`);
  }

  function showToast(message, color = "white") {
    ui.toast.textContent = message; ui.toast.style.color = color; ui.toast.classList.remove("hidden");
    ui.toast.style.animation = "none"; void ui.toast.offsetWidth; ui.toast.style.animation = "toastPop .72s ease-out both";
    clearTimeout(toastTimer); toastTimer = setTimeout(() => ui.toast.classList.add("hidden"), 730);
  }

  function addScore(base, x, y) {
    state.combo++; state.maxCombo = Math.max(state.maxCombo, state.combo); state.hits++; state.attempts++;
    const multiplier = state.feverUntil > now ? 3 : Math.min(1 + Math.floor(state.combo / 8), 5);
    const points = base * multiplier; state.score += points; state.fever = Math.min(100, state.fever + 7);
    state.floaters.push({ x, y, text: `+${points}`, color: multiplier >= 3 ? "#ffe14d" : "#fff", life: 1, vy: -52 });
    if (state.combo % 7 === 0) showToast(SILLY_PRAISE[Math.floor(Math.random() * SILLY_PRAISE.length)], COLORS[state.combo % COLORS.length]);
    if (state.fever >= 100 && state.feverUntil < now) {
      state.feverUntil = now + 7000; state.fever = 0; state.shields = Math.min(state.maxShields, state.shields + 1);
      showToast("🔥 FEVER RIOT!!!", "#ffe14d"); sound("fever"); state.flash = .7;
    } else sound("hit");
    haptic(10); updateHud();
  }

  function fail(reason, severe = true, x = W / 2, y = H / 2) {
    state.attempts++; state.combo = 0; state.fever = Math.max(0, state.fever - 15); state.shake = severe ? 12 : 6;
    if (severe) state.shields--;
    state.floaters.push({ x, y, text: severe ? "BONK!" : "NOPE!", color: "#ff3d57", life: 1, vy: -32 });
    showToast(reason || SILLY_MISS[Math.floor(Math.random() * SILLY_MISS.length)], "#ff6b7e"); sound("bad"); haptic(45); updateHud();
    if (state.shields <= 0) endGame();
  }

  function burst(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = Math.random() * 240 + 70;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: Math.random() * 6 + 2, color, life: 1, gravity: 170 });
    }
    state.ripples.push({ x, y, r: 6, life: 1, color });
  }

  function safeBounds() { const left=settings.oneHand?Math.max(36,W*.38):36;return { top: Math.max(105, H * .14), bottom: H - Math.max(82, H * .11), left, right: W - 36 }; }
  function targetScale(){return (LEVELS[settings.level]||LEVELS.normal).size*(settings.largeTargets?1.25:1)}

  function spawnStick() {
    const b = safeBounds(); const h = Math.max(78, Math.min(132, H * .15))*targetScale(); const w = Math.max(28, h * .28);
    state.entities.push({ kind: "stick", x: b.left + Math.random() * (b.right - b.left), y: b.top - h, w, h,
      vy: (165 + state.difficulty * 32 + Math.random() * 95) * Math.min(1.35, H / 700)*(LEVELS[settings.level]||LEVELS.normal).speed, color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: (Math.random() - .5) * .34, spin: (Math.random() - .5) * .5, face: Math.floor(Math.random() * 3), dead: false });
  }

  function spawnSmash() {
    const b = safeBounds(); const bombChance = .13 + Math.min(.11, state.difficulty * .012); const bomb = Math.random() < bombChance;
    const r = Math.max(31, Math.min(58, Math.min(W,H) * .065))*targetScale();
    state.entities.push({ kind: bomb ? "bomb" : "orb", x: b.left + r + Math.random() * Math.max(1, b.right - b.left - 2*r), y: b.top + r + Math.random() * Math.max(1, b.bottom - b.top - 2*r),
      r, born: now, ttl: Math.max(520, 1120 - state.difficulty * 48), color: COLORS[Math.floor(Math.random() * COLORS.length)], pulse: Math.random() * 6, dead: false });
  }

  function spawnSwipe() {
    if (state.entities.some(e => e.kind === "swipe")) return;
    const b = safeBounds(); const dir = Math.floor(Math.random() * 4); const size = Math.max(74, Math.min(125, Math.min(W,H)*.15))*targetScale();
    state.entities.push({ kind: "swipe", x: b.left + size + Math.random() * Math.max(1,b.right-b.left-size*2), y: b.top + size + Math.random() * Math.max(1,b.bottom-b.top-size*2),
      dir, size, born: now, ttl: Math.max(750, 1550 - state.difficulty * 55), color: COLORS[(dir + state.modeIndex) % COLORS.length], dead: false });
  }

  function spawnFreezeTarget() {
    if (state.entities.some(e => e.kind === "freeze")) return;
    const b = safeBounds(); const r = Math.max(36, Math.min(64, Math.min(W,H)*.072))*targetScale();
    state.entities.push({ kind: "freeze", x: b.left+r+Math.random()*Math.max(1,b.right-b.left-2*r), y: b.top+r+Math.random()*Math.max(1,b.bottom-b.top-2*r), r,
      vx: (Math.random()-.5)*160, vy:(Math.random()-.5)*130, dead:false });
  }

  function randomSpot(r){const b=safeBounds();return{x:b.left+r+Math.random()*Math.max(1,b.right-b.left-2*r),y:b.top+r+Math.random()*Math.max(1,b.bottom-b.top-2*r)}}
  function spawnColor(){if(state.entities.length)return;const r=52*targetScale(),spot=randomSpot(r),index=Math.floor(Math.random()*4),match=Math.random()>.42,wordIndex=match?index:(index+1+Math.floor(Math.random()*3))%4;state.entities.push({kind:"color",...spot,r,born:now,ttl:1500,color:COLORS[index],word:["YELLOW","CYAN","PINK","PURPLE"][wordIndex],match,dead:false})}
  function spawnNumber(){if(state.entities.length)return;state.numberTarget=1;const b=safeBounds(),positions=[.25,.5,.75].map((fraction,index)=>({kind:"number",x:b.left+(b.right-b.left)*fraction,y:H*.5+(index%2?70:-55),r:45*targetScale(),value:index+1,dead:false}));state.entities=positions.sort(()=>Math.random()-.5)}
  function spawnHold(){if(state.entities.length)return;const r=58*targetScale(),spot=randomSpot(r);state.entities.push({kind:"hold",...spot,r,born:now,held:false,holdAt:0,dead:false})}
  function spawnStar(){if(state.entities.length)return;const r=38*targetScale(),placed=[];for(let index=0;index<6;index++){let spot=randomSpot(r),tries=0;while(placed.some(item=>Math.hypot(item.x-spot.x,item.y-spot.y)<r*2.15)&&tries<30){spot=randomSpot(r);tries++}placed.push({kind:index===0?"star":"decoy",...spot,r,dead:false})}state.entities=placed.sort(()=>Math.random()-.5)}

  function spawnForMode() {
    if (state.mode === "sticks") { spawnStick(); state.spawnAt = now + Math.max(210, 720 - state.difficulty * 32); }
    if (state.mode === "smash") { spawnSmash(); state.spawnAt = now + Math.max(240, 620 - state.difficulty * 27); }
    if (state.mode === "swipe") { spawnSwipe(); state.spawnAt = now + 260; }
    if (state.mode === "freeze") { spawnFreezeTarget(); state.spawnAt = now + 280; }
    if (state.mode === "color") { spawnColor(); state.spawnAt = now + 300; }
    if (state.mode === "number") { spawnNumber(); state.spawnAt = now + 350; }
    if (state.mode === "hold") { spawnHold(); state.spawnAt = now + 300; }
    if (state.mode === "star") { spawnStar(); state.spawnAt = now + 420; }
  }

  function update(dt) {
    for (const s of state.stars) { s.y += s.speed * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    updateEffects(dt);
    if (!state.playing || state.paused) return;
    now = performance.now();
    if(state.gameKind==="reaction"||state.gameKind==="calibrate"){
      if(!state.reactionBorn&&now>=state.reactionReadyAt){const r=64*targetScale(),spot=randomSpot(r);state.entities=[{kind:"reaction",...spot,r,dead:false}];state.reactionBorn=now;tone(650,.06,"square",.05)}
      return;
    }
    state.remaining = state.duration - (now - state.startedAt) / 1000;
    const calibrationPace=settings.calibration?Math.max(.85,Math.min(1.15,280/settings.calibration)):1;state.difficulty = (1 + (state.duration - state.remaining) / 8)*calibrationPace;
    if (state.remaining <= 0) { state.remaining = 0; updateHud(); endGame(); return; }
    const modeLength = state.gameKind === "duel" ? 4.2 : 7.2;
    if ((now - state.lastModeAt) / 1000 > modeLength) nextMode();
    if (state.feverUntil > 0 && now > state.feverUntil) { state.feverUntil = 0; showToast("FEVER COOLED OFF", "#aab7d8"); }
    if (now > state.spawnAt && now > state.modeIntroUntil - 700) spawnForMode();
    if (state.mode === "freeze" && now > state.freezeChangeAt) {
      state.freezeGreen = !state.freezeGreen;
      state.freezeChangeAt = now + (state.freezeGreen ? 900 + Math.random()*850 : 520 + Math.random()*650);
      state.flash = state.freezeGreen ? .16 : .25; tone(state.freezeGreen ? 610 : 145, .09, "square", .035, state.freezeGreen ? 120 : -40);
    }
    updateEntities(dt); updateHud();
  }

  function updateEntities(dt) {
    const b = safeBounds();
    for (const e of state.entities) {
      if (e.kind === "stick") {
        e.y += e.vy * dt; e.rot += e.spin * dt;
        if (e.y - e.h/2 > b.bottom && !e.dead) { e.dead = true; fail(SILLY_MISS[Math.floor(Math.random()*SILLY_MISS.length)], true, e.x, b.bottom); }
      }
      if ((e.kind === "orb" || e.kind === "bomb") && now - e.born > e.ttl && !e.dead) {
        e.dead = true; if (e.kind === "orb") fail("POOF! TOO SLOW", true, e.x, e.y);
      }
      if (e.kind === "swipe" && now - e.born > e.ttl && !e.dead) { e.dead = true; fail("SWIPE ESCAPED!", true, e.x, e.y); }
      if (e.kind === "freeze") {
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.x-e.r < b.left || e.x+e.r > b.right) e.vx *= -1;
        if (e.y-e.r < b.top || e.y+e.r > b.bottom) e.vy *= -1;
      }
      if(e.kind==="color"&&now-e.born>e.ttl&&!e.dead){e.dead=true;if(e.match)fail("COLOR ESCAPED!",true,e.x,e.y);else addScore(75,e.x,e.y)}
    }
    state.entities = state.entities.filter(e => !e.dead);
  }

  function updateEffects(dt) {
    for (const p of state.particles) { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.gravity*dt; p.life -= dt*1.8; p.r *= .992; }
    for (const f of state.floaters) { f.y += f.vy*dt; f.life -= dt*1.45; }
    for (const r of state.ripples) { r.r += 240*dt; r.life -= dt*2.25; }
    state.particles = state.particles.filter(p => p.life > 0); state.floaters = state.floaters.filter(f => f.life > 0); state.ripples = state.ripples.filter(r => r.life > 0);
    state.shake *= Math.pow(.025, dt); state.flash = Math.max(0, state.flash - dt*1.8);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top, t: performance.now() };
  }

  function onPointerDown(event) {
    if (!state.playing) return;
    event.preventDefault(); canvas.setPointerCapture?.(event.pointerId); const p = pointerPosition(event); state.pointer = p;
    state.ripples.push({ x:p.x, y:p.y, r:5, life:.55, color:"#ffffff" });
    if(state.gameKind==="reaction"||state.gameKind==="calibrate"){
      const target=state.entities.find(entity=>entity.kind==="reaction"&&Math.hypot(p.x-entity.x,p.y-entity.y)<entity.r*1.25);if(target){finishReaction(Math.round(performance.now()-state.reactionBorn))}else{showToast("FALSE START!","#ff3d57");scheduleReactionTarget()}return;
    }
    if(state.mode==="hold"){const target=state.entities.find(entity=>entity.kind==="hold"&&Math.hypot(p.x-entity.x,p.y-entity.y)<entity.r*1.25);if(target){target.held=true;target.holdAt=performance.now()}else fail("HOLD THE BUTTON!",false,p.x,p.y);return}
    if (state.mode !== "swipe") handleTap(p.x,p.y);
  }

  function onPointerUp(event) {
    if (!state.playing || !state.pointer) return;
    const p = pointerPosition(event); const start = state.pointer; state.pointer = null;
    if (state.mode === "swipe") handleSwipe(start,p);
    if(state.mode==="hold"){const target=state.entities.find(entity=>entity.kind==="hold"&&entity.held);if(target){const held=performance.now()-target.holdAt;target.dead=true;if(held>=500&&held<=950){burst(target.x,target.y,"#36f59d",28);addScore(180,target.x,target.y)}else fail(held<500?"TOO QUICK!":"TOO LONG!",true,target.x,target.y)}}
  }

  function handleTap(x,y) {
    const candidates = [...state.entities].reverse();
    for (const e of candidates) {
      let hit = false;
      if (e.kind === "stick") hit = Math.abs(x-e.x) < e.w*.95 && Math.abs(y-e.y) < e.h*.7;
      if (["orb","bomb","freeze","color","number","star","decoy"].includes(e.kind)) hit = Math.hypot(x-e.x,y-e.y) < e.r*1.25;
      if (!hit) continue;
      e.dead = true;
      if (e.kind === "bomb") { burst(e.x,e.y,"#ff3d57",28); fail("💣 SPICY MEATBALL!",true,e.x,e.y); }
      else if (e.kind === "freeze" && !state.freezeGreen) { burst(e.x,e.y,"#ff3d57",22); fail("FREEZE MEANS FREEZE!",true,e.x,e.y); }
      else if(e.kind==="color"){if(e.match){burst(e.x,e.y,e.color,24);addScore(150,e.x,e.y)}else fail("WORD + COLOR DON'T MATCH!",true,e.x,e.y)}
      else if(e.kind==="number"){if(e.value===state.numberTarget){burst(e.x,e.y,"#8b5cf6",18);addScore(80,e.x,e.y);state.numberTarget++;if(state.numberTarget>3)state.entities.forEach(entity=>entity.dead=true)}else{state.entities.forEach(entity=>entity.dead=true);fail(`FIND ${state.numberTarget} FIRST!`,true,e.x,e.y)}}
      else if(e.kind==="star"){state.entities.forEach(entity=>entity.dead=true);burst(e.x,e.y,"#ffe14d",28);addScore(170,e.x,e.y)}
      else if(e.kind==="decoy"){state.entities.forEach(entity=>entity.dead=true);fail("THAT'S A DECOY!",true,e.x,e.y)}
      else { burst(e.x,e.y,e.color || (state.freezeGreen ? "#36f59d":"#ff3d57"),e.kind === "stick" ? 18:24); addScore(e.kind === "stick" ? 110 : e.kind === "freeze" ? 150 : 100,e.x,e.y); sound(e.kind === "orb" ? "pop":"hit"); }
      return;
    }
    if (state.mode === "freeze" && !state.freezeGreen) fail("RED LIGHT! SNEAKY!",true,x,y);
    else { state.attempts++; state.combo = 0; tone(120,.05,"square",.025,-20); }
  }

  function handleSwipe(start,end) {
    const dx=end.x-start.x, dy=end.y-start.y, distance=Math.hypot(dx,dy); const e=state.entities.find(item=>item.kind==="swipe");
    state.attempts++;
    if (!e || distance < 45) { fail("BIGGER SWIPE!",false,end.x,end.y); return; }
    const dir = Math.abs(dx)>Math.abs(dy) ? (dx>0?1:3) : (dy>0?2:0);
    if (dir === e.dir) { e.dead=true; state.attempts--; burst(e.x,e.y,e.color,30); addScore(160,e.x,e.y); sound("swipe"); }
    else { fail("OTHER WAY, CHAMP!",true,e.x,e.y); e.dead=true; }
  }

  async function endGame() {
    if (!state.playing) return; state.playing=false; ui.hud.classList.add("hidden");
    setBest(state.score);
    if(state.gameKind==="solo"){settings.totalScore=(settings.totalScore||0)+state.score;saveSettings()}
    if (state.gameKind === "duel" && state.duelRound === 1) {
      state.duelScores[0]=state.score; state.duelRound=2;
      showToast("PASS THE iPAD!", "#ffe14d");
      await new Promise(resolve=>setTimeout(resolve,800));
      await startGame("duel",true); return;
    }
    if (state.gameKind === "duel") state.duelScores[1]=state.score;
    showResults();
  }

  function showResults() {
    state.screen="results"; showScreen("#results");
    ui.nameEntry.classList.add("hidden");$("#again-button").textContent="↻ RIOT AGAIN";
    const accuracy = state.attempts ? Math.round(state.hits/state.attempts*100) : 0;
    ui.resultScore.textContent=state.score.toLocaleString(); ui.bestCombo.textContent=state.maxCombo; ui.accuracy.textContent=`${accuracy}%`; ui.statBest.textContent=bestScore().toLocaleString();
    const rank = state.score>12000?"👑 RIOT LEGEND":state.score>7500?"⚡ LIGHTNING HANDS":state.score>4000?"🦖 TURBO T-REX":state.score>1800?"🐒 CHAOS MONKEY":"🐣 RIOT ROOKIE";
    ui.resultRank.textContent=rank; ui.duelResult.classList.add("hidden");
    if (state.gameKind==="duel") {
      const [a,b]=state.duelScores; const verdict=a===b?"IMPOSSIBLE TIE! BOTH WIN!":a>b?`PLAYER 1 WINS BY ${(a-b).toLocaleString()}!`:`PLAYER 2 WINS BY ${(b-a).toLocaleString()}!`;
      ui.resultKicker.textContent=`PLAYER 1: ${a.toLocaleString()}  ·  PLAYER 2: ${b.toLocaleString()}`; ui.resultScore.textContent=Math.max(a,b).toLocaleString(); ui.duelResult.textContent=`🏆 ${verdict}`; ui.duelResult.classList.remove("hidden");
    } else {ui.resultKicker.textContent=state.score>=bestScore()?"NEW HIGH SCORE!":"RIOT COMPLETE";offerRecord("score",state.score)}
    burst(W/2,H*.28,"#ffe14d",60); sound("fever");
  }

  function draw() {
    ctx.save(); ctx.clearRect(0,0,W,H);
    const sx=(Math.random()-.5)*state.shake, sy=(Math.random()-.5)*state.shake; ctx.translate(sx,sy);
    drawBackground();
    if (state.playing) { drawModeBackdrop(); for (const e of state.entities) drawEntity(e); }
    drawEffects();
    if (state.flash>0&&!settings.reduceFlash) { ctx.fillStyle=`rgba(255,255,255,${state.flash*.24})`; ctx.fillRect(0,0,W,H); }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle="#080b18"; ctx.fillRect(0,0,W,H);
    const gradient=ctx.createRadialGradient(W*.5,H*.48,10,W*.5,H*.48,Math.max(W,H)*.72);
    const fever=state.feverUntil>now; gradient.addColorStop(0,fever?"#48135f":"#171d48"); gradient.addColorStop(1,"#070a16"); ctx.fillStyle=gradient; ctx.fillRect(0,0,W,H);
    for (const s of state.stars) { ctx.globalAlpha=s.alpha; ctx.fillStyle="#cbd8ff"; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
    if (state.playing) {
      ctx.strokeStyle=fever?"rgba(255,61,154,.18)":"rgba(114,134,207,.09)"; ctx.lineWidth=1;
      const gap=Math.max(48,Math.min(74,W/12)); const offset=(now*.018)%gap;
      for(let x=-gap+offset;x<W+gap;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-gap*.4,H);ctx.stroke();}
      for(let y=-gap+offset;y<H+gap;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+gap*.25);ctx.stroke();}
    }
  }

  function drawModeBackdrop() {
    if (state.mode!=="freeze") return;
    const green=state.freezeGreen; ctx.fillStyle=green?"rgba(54,245,157,.105)":"rgba(255,61,87,.14)"; ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalAlpha=.16;ctx.fillStyle=green?"#36f59d":"#ff3d57";ctx.font=`1000 ${Math.min(W*.2,H*.25)}px ui-rounded,system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(green?"GO!":"FREEZE!",W/2,H/2);ctx.restore();
  }

  function roundRect(x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }

  function drawFace(x,y,scale,mood="happy") {
    ctx.fillStyle="#12172e"; ctx.beginPath();ctx.arc(x-scale*.26,y-scale*.08,scale*.085,0,Math.PI*2);ctx.arc(x+scale*.26,y-scale*.08,scale*.085,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#12172e";ctx.lineWidth=Math.max(2,scale*.06);ctx.lineCap="round";ctx.beginPath();
    if(mood==="scared")ctx.arc(x,y+scale*.19,scale*.12,0,Math.PI*2); else ctx.arc(x,y+scale*.05,scale*.25,.15*Math.PI,.85*Math.PI);ctx.stroke();
  }

  function drawEntity(e) {
    ctx.save();
    if(e.kind==="stick"){
      ctx.translate(e.x,e.y);ctx.rotate(e.rot);ctx.shadowColor=e.color;ctx.shadowBlur=22;ctx.fillStyle=e.color;roundRect(-e.w/2,-e.h/2,e.w,e.h,e.w/2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle="rgba(255,255,255,.32)";roundRect(-e.w*.24,-e.h*.42,e.w*.18,e.h*.62,e.w*.12);ctx.fill();drawFace(0,e.h*.13,e.w*.9,e.face===1?"scared":"happy");
      ctx.fillStyle="rgba(255,255,255,.25)";ctx.beginPath();ctx.moveTo(-e.w*.7,-e.h*.32);ctx.lineTo(-e.w*1.5,-e.h*.55);ctx.lineTo(-e.w*.85,-e.h*.05);ctx.fill();
    }
    if(e.kind==="orb"||e.kind==="bomb"){
      const age=(now-e.born)/e.ttl;const pulse=1+Math.sin(now*.015+e.pulse)*.08;ctx.translate(e.x,e.y);ctx.scale(pulse,pulse);ctx.globalAlpha=Math.max(.18,1-age*.55);
      ctx.shadowColor=e.kind==="bomb"?"#ff3d57":e.color;ctx.shadowBlur=28;ctx.fillStyle=e.kind==="bomb"?"#24283a":e.color;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(e.kind==="bomb"){
        ctx.strokeStyle="#ff9c3d";ctx.lineWidth=e.r*.13;ctx.beginPath();ctx.moveTo(e.r*.35,-e.r*.7);ctx.quadraticCurveTo(e.r*.8,-e.r*1.25,e.r*.68,-e.r*1.55);ctx.stroke();
        ctx.fillStyle="#ffe14d";ctx.beginPath();ctx.arc(e.r*.68,-e.r*1.55,e.r*.18*(1+Math.sin(now*.03)*.3),0,Math.PI*2);ctx.fill();drawFace(0,0,e.r,"scared");
      } else { ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(-e.r*.15,-e.r*.15,e.r*.64,Math.PI*1.05,Math.PI*1.65);ctx.stroke();drawFace(0,3,e.r,"happy"); }
      ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.r*(1.3+age*.65),0,Math.PI*2);ctx.stroke();
    }
    if(e.kind==="swipe"){
      const age=(now-e.born)/e.ttl;const angle=[0,Math.PI/2,Math.PI,-Math.PI/2][e.dir];ctx.translate(e.x,e.y);ctx.rotate(angle);ctx.scale(1+Math.sin(now*.012)*.06,1+Math.sin(now*.012)*.06);
      ctx.shadowColor=e.color;ctx.shadowBlur=25;ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(0,-e.size*.64);ctx.lineTo(e.size*.57,0);ctx.lineTo(e.size*.2,0);ctx.lineTo(e.size*.2,e.size*.6);ctx.lineTo(-e.size*.2,e.size*.6);ctx.lineTo(-e.size*.2,0);ctx.lineTo(-e.size*.57,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle=`rgba(255,255,255,${.65-age*.35})`;ctx.lineWidth=5;ctx.stroke();drawFace(0,e.size*.18,e.size*.55,"happy");
    }
    if(e.kind==="freeze"){
      const color=state.freezeGreen?"#36f59d":"#ff3d57";ctx.translate(e.x,e.y);ctx.shadowColor=color;ctx.shadowBlur=30;ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,e.r*.78,0,Math.PI*2);ctx.stroke();drawFace(0,0,e.r,state.freezeGreen?"happy":"scared");
    }
    if(e.kind==="color"){
      ctx.translate(e.x,e.y);ctx.shadowColor=e.color;ctx.shadowBlur=24;ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#11162b";ctx.font=`1000 ${Math.max(12,e.r*.34)}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(e.word,0,settings.symbolCues?8:0);if(settings.symbolCues){ctx.font=`1000 ${e.r*.3}px system-ui`;ctx.fillText(e.match?"✓":"×",0,-e.r*.42)}
    }
    if(e.kind==="number"){
      ctx.translate(e.x,e.y);ctx.fillStyle=e.value===state.numberTarget?"#ffe14d":"#8b5cf6";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#12172e";ctx.font=`1000 ${e.r}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(e.value,0,2)
    }
    if(e.kind==="hold"){
      const held=e.held?performance.now()-e.holdAt:0,progress=Math.min(1,held/700),good=held>=500&&held<=950;ctx.translate(e.x,e.y);ctx.fillStyle=good?"#36f59d":"#22d3ee";ctx.beginPath();ctx.arc(0,0,e.r*.78,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,e.r,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.fillStyle="#11162b";ctx.font=`1000 ${e.r*.3}px system-ui`;ctx.textAlign="center";ctx.fillText(e.held?"HOLD":"PRESS",0,5)
    }
    if(e.kind==="star"||e.kind==="decoy"){
      ctx.translate(e.x,e.y);ctx.fillStyle=e.kind==="star"?"#ffe14d":"#37405f";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=e.kind==="star"?16:4;ctx.beginPath();for(let i=0;i<10;i++){const radius=i%2?e.r*.45:e.r,angle=-Math.PI/2+i*Math.PI/5,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.shadowBlur=0;if(settings.symbolCues&&e.kind==="star"){ctx.fillStyle="#12172e";ctx.font=`1000 ${e.r*.45}px system-ui`;ctx.textAlign="center";ctx.fillText("★",0,6)}
    }
    if(e.kind==="reaction"){
      ctx.translate(e.x,e.y);ctx.shadowColor="#36f59d";ctx.shadowBlur=38;ctx.fillStyle="#36f59d";ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#10182b";ctx.font=`1000 ${e.r*.45}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("TAP!",0,2)
    }
    ctx.restore();
  }

  function drawEffects(){
    for(const r of state.ripples){ctx.globalAlpha=r.life*.7;ctx.strokeStyle=r.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();}
    for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.x*.01);ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2);ctx.restore();}
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="1000 25px ui-rounded,system-ui";
    for(const f of state.floaters){ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=12;ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;}
    ctx.globalAlpha=1;
  }

  function renderSettings(){
    document.querySelectorAll("[data-level]").forEach(button=>button.classList.toggle("active",button.dataset.level===settings.level));
    document.querySelectorAll("[data-riot-skin]").forEach(button=>{const unlocked=(settings.totalScore||0)>=SKINS[button.dataset.riotSkin];button.disabled=!unlocked;button.classList.toggle("active",button.dataset.riotSkin===settings.skin);button.title=unlocked?"Unlocked":`Unlock at ${SKINS[button.dataset.riotSkin].toLocaleString()} lifetime points`});
    $("#reduce-flash").checked=Boolean(settings.reduceFlash);$("#large-targets").checked=Boolean(settings.largeTargets);$("#symbol-cues").checked=Boolean(settings.symbolCues);$("#one-hand").checked=Boolean(settings.oneHand);$("#calibration-copy").textContent=settings.calibration?`Calibrated baseline: ${settings.calibration} ms · lifetime points ${(settings.totalScore||0).toLocaleString()}`:`No calibration yet · lifetime points ${(settings.totalScore||0).toLocaleString()}`;
  }

  function loop(timestamp) { now=timestamp; const dt=Math.min(.034,(timestamp-last)/1000||.016); last=timestamp; update(dt); draw(); animationId=requestAnimationFrame(loop); }

  $("#play-button").addEventListener("click",()=>startGame("solo"));
  $("#duel-button").addEventListener("click",()=>startGame("duel"));
  $("#reaction-button").addEventListener("click",()=>startReaction(false));
  $("#leaderboard-button").addEventListener("click",()=>{renderLeaderboards();showScreen("#leaderboard");state.screen="leaderboard"});
  $("#settings-button").addEventListener("click",()=>{renderSettings();showScreen("#settings");state.screen="settings"});
  $("#how-button").addEventListener("click",()=>{showScreen("#how");state.screen="how";});
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{showScreen("#menu");state.screen="menu";}));
  $("#again-button").addEventListener("click",()=>state.gameKind==="reaction"||state.gameKind==="calibrate"?startReaction(false):startGame(state.gameKind));
  $("#menu-button").addEventListener("click",()=>{state.playing=false;showScreen("#menu");state.screen="menu";ui.best.textContent=bestScore().toLocaleString();});
  ui.sound.addEventListener("click",toggleSound); ui.soundState.addEventListener("click",toggleSound);
  $("#save-record-button").addEventListener("click",saveRecord);ui.recordName.addEventListener("keydown",event=>{if(event.key==="Enter")saveRecord()});
  $("#difficulty-settings").addEventListener("click",event=>{const button=event.target.closest("[data-level]");if(!button)return;settings.level=button.dataset.level;saveSettings();renderSettings()});
  $("#skin-settings").addEventListener("click",event=>{const button=event.target.closest("[data-riot-skin]");if(!button||button.disabled)return;settings.skin=button.dataset.riotSkin;saveSettings();renderSettings()});
  [["#reduce-flash","reduceFlash"],["#large-targets","largeTargets"],["#symbol-cues","symbolCues"],["#one-hand","oneHand"]].forEach(([selector,key])=>$(selector).addEventListener("change",event=>{settings[key]=event.target.checked;saveSettings()}));
  $("#calibrate-button").addEventListener("click",()=>startReaction(true));
  canvas.addEventListener("pointerdown",onPointerDown,{passive:false});canvas.addEventListener("pointerup",onPointerUp,{passive:false});canvas.addEventListener("pointercancel",()=>state.pointer=null);
  addEventListener("resize",resize);document.addEventListener("visibilitychange",()=>{if(state.playing){if(document.hidden){state.paused=true;}else{state.startedAt=performance.now()-(state.duration-state.remaining)*1000;state.lastModeAt=performance.now();state.paused=false;showToast("WELCOME BACK!","#22d3ee");}}});
  document.addEventListener("contextmenu",event=>event.preventDefault());

  resize(); updateSound(); applySettings();renderSettings();renderLeaderboards();ui.best.textContent=bestScore().toLocaleString();
  if (location.protocol === "file:") $("#exit-button").classList.add("hidden");
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  cancelAnimationFrame(animationId); animationId=requestAnimationFrame(loop);
})();
