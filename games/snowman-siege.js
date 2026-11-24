// Generated from snowman-siege.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const { useState, useEffect, useCallback, useRef } = React;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;
let DPR = Math.min(window.devicePixelRatio || 1, 2);
const BASE_MAX_HP = 5;
const BASE_MAX_AMMO = 40;
const BASE_FIRE_RATE = 1e3 / 12;
const BASE_RELOAD_TIME = 1200;
const WAVE_INTERVAL = 15e3;
const DANGER_LINE_Y = 720;
const BASE_DAMAGE = 1;
const ENEMY_STATS = {
  BASIC: { hp: 3, speed: 1.2, points: 100, radius: 25 },
  CHUNKY: { hp: 8, speed: 0.6, points: 250, radius: 40 },
  THROWER: { hp: 4, speed: 1, points: 200, radius: 22 },
  BOSS: { hp: 85, speed: 0.45, points: 2500, radius: 58 }
};
const COLORS = {
  SKY_TOP: "#2c3e50",
  SKY_BOTTOM: "#34495e",
  SNOW: "#ecf0f1",
  SNOW_SHADOW: "#bdc3c7",
  AMMO: "#f1c40f",
  PLAYER_PROJECTILE: "#ffffff",
  ENEMY_PROJECTILE: "#e74c3c",
  DANGER: "#e74c3c"
};
const EnemyType = { BASIC: "BASIC", CHUNKY: "CHUNKY", THROWER: "THROWER", BOSS: "BOSS" };
const Screen = { HOME: "HOME", GAME: "GAME", GAMEOVER: "GAMEOVER", SHOP: "SHOP" };
const LAUNCHERS = {
  rapid: { name: "Rapid Snow", icon: "❄️", desc: "Fast, light snowballs", rate: 0.55, damage: 0.75, speed: 22, radius: 5 },
  cannon: { name: "Ice Cannon", icon: "💣", desc: "Slow splash blasts", rate: 2.35, damage: 2.4, speed: 15, radius: 11, splash: 75 },
  ricochet: { name: "Ricochet Ice", icon: "💠", desc: "Bank shots off walls", rate: 1.15, damage: 1.05, speed: 21, radius: 7, bounces: 3 },
  homing: { name: "Homing Flakes", icon: "✨", desc: "Tracks the nearest threat", rate: 1.45, damage: 1.2, speed: 17, radius: 6, homing: true }
};
const WINTER_BIOMES = [
  { name: "Pinecone Village", icon: "🏘️", goalWave: 5, objective: "Defeat 20 invaders", check: (s) => s.totalEnemiesKilled >= 20, skyTop: "#1d3557", skyBottom: "#457b9d" },
  { name: "Whispering Forest", icon: "🌲", goalWave: 7, objective: "Build a 10-hit combo", check: (s) => s.highestCombo >= 10, skyTop: "#102a2a", skyBottom: "#24544b" },
  { name: "Glacier Pass", icon: "🏔️", goalWave: 9, objective: "Finish with 35% accuracy", check: (s) => s.totalShotsFired > 0 && s.totalShotsHit / s.totalShotsFired >= 0.35, skyTop: "#16324f", skyBottom: "#1f7a8c" },
  { name: "Aurora Fortress", icon: "🌌", goalWave: 12, objective: "Defeat the wave-10 boss and survive", check: (s) => s.wave10BossDefeated, skyTop: "#160f35", skyBottom: "#4c1d6f" }
];
const PowerUpType = {
  HEALTH: "HEALTH",
  RAPID_FIRE: "RAPID_FIRE",
  SPREAD_SHOT: "SPREAD_SHOT",
  FREEZE_BOMB: "FREEZE_BOMB"
};
const POWER_UP_CONFIG = {
  [PowerUpType.HEALTH]: { color: "#2ecc71", symbol: "heart", label: "+HP", duration: 0 },
  [PowerUpType.RAPID_FIRE]: { color: "#f1c40f", symbol: "bolt", label: "RAPID FIRE", duration: 5e3 },
  [PowerUpType.SPREAD_SHOT]: { color: "#3498db", symbol: "triple", label: "SPREAD", duration: 5e3 },
  [PowerUpType.FREEZE_BOMB]: { color: "#00d2d3", symbol: "snowflake", label: "FREEZE", duration: 3e3 }
};
const POWER_UP_DROP_CHANCE = 0.15;
const POWER_UP_FALL_SPEED = 1.5;
const COMBO_TIERS = [
  { hits: 20, multiplier: 4 },
  { hits: 12, multiplier: 3 },
  { hits: 5, multiplier: 2 },
  { hits: 0, multiplier: 1 }
];
const THEMED_WAVES = {
  5: { name: "CHUNKY RUSH", subtext: "Heavy hitters incoming!", spawnBias: { CHUNKY: 0.7, BASIC: 0.2, THROWER: 0.1 } },
  8: { name: "SNOWBALL STORM", subtext: "Dodge the barrage!", spawnBias: { THROWER: 0.6, BASIC: 0.3, CHUNKY: 0.1 } },
  10: { name: "FROZEN FURY", subtext: "Everything at once!", spawnBias: { BASIC: 0.33, CHUNKY: 0.34, THROWER: 0.33 } },
  15: { name: "MEGA RUSH", subtext: "Survive the onslaught!", spawnBias: { CHUNKY: 0.5, THROWER: 0.4, BASIC: 0.1 } }
};
const UPGRADE_DEFS = {
  maxHp: { name: "Thick Walls", desc: "+1 Max HP", baseCost: 50, costMult: 1.8, maxLevel: 5, icon: "&#x2764;" },
  maxAmmo: { name: "Ammo Belt", desc: "+5 Ammo Capacity", baseCost: 40, costMult: 1.5, maxLevel: 6, icon: "&#x1F4E6;" },
  reloadSpeed: { name: "Quick Loader", desc: "-15% Reload Time", baseCost: 60, costMult: 2, maxLevel: 4, icon: "&#x26A1;" },
  startWave: { name: "Wave Skip", desc: "Start at higher wave", baseCost: 100, costMult: 2.5, maxLevel: 5, icon: "&#x23E9;" },
  damage: { name: "Hardened Snowballs", desc: "+1 Launcher Damage", baseCost: 120, costMult: 2.2, maxLevel: 3, icon: "&#x1F4A5;" }
};
const getUpgradeCost = (key, level) => Math.floor(UPGRADE_DEFS[key].baseCost * Math.pow(UPGRADE_DEFS[key].costMult, level));
const loadUpgrades = () => {
  try {
    const saved = localStorage.getItem("snowman_siege_upgrades");
    if (saved) return JSON.parse(saved);
  } catch (e) {
  }
  return { maxHp: 0, maxAmmo: 0, reloadSpeed: 0, startWave: 0, damage: 0 };
};
const saveUpgrades = (upgrades) => {
  localStorage.setItem("snowman_siege_upgrades", JSON.stringify(upgrades));
};
const loadSnowflakes = () => {
  try {
    const saved = localStorage.getItem("snowman_siege_snowflakes");
    if (saved) return parseInt(saved, 10);
  } catch (e) {
  }
  return 0;
};
const saveSnowflakes = (amount) => {
  localStorage.setItem("snowman_siege_snowflakes", amount.toString());
};
const getEffectiveStats = (upgrades) => ({
  maxHp: BASE_MAX_HP + upgrades.maxHp * 1,
  maxAmmo: BASE_MAX_AMMO + upgrades.maxAmmo * 5,
  reloadTime: Math.round(BASE_RELOAD_TIME * Math.pow(0.85, upgrades.reloadSpeed)),
  startWave: 1 + upgrades.startWave,
  damage: BASE_DAMAGE + upgrades.damage
});
let audioCtx = null;
const initAudio = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {
  }
};
const playSound = (freq, type, duration, volume = 0.1) => {
  try {
    const ctx = audioCtx;
    if (!ctx || ctx.state !== "running") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
  }
};
const ShopView = ({ onBack, snowflakes, setSnowflakes, upgrades, setUpgrades }) => {
  const handleBuy = (key) => {
    const level = upgrades[key];
    const def = UPGRADE_DEFS[key];
    if (level >= def.maxLevel) return;
    const cost = getUpgradeCost(key, level);
    if (snowflakes < cost) return;
    const newFlakes = snowflakes - cost;
    const newUpgrades = { ...upgrades, [key]: level + 1 };
    setSnowflakes(newFlakes);
    setUpgrades(newUpgrades);
    saveSnowflakes(newFlakes);
    saveUpgrades(newUpgrades);
    initAudio();
    playSound(600, "sine", 0.15, 0.06);
  };
  const stats = getEffectiveStats(upgrades);
  return /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 flex items-center justify-between border-b border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onBack,
      className: "bg-white/10 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
    },
    "← BACK"
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300 text-lg" }, "❄"), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-mono font-bold text-cyan-300" }, snowflakes.toLocaleString()))), /* @__PURE__ */ React.createElement("div", { className: "p-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black tracking-tight mb-1" }, "UPGRADE SHOP"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-4" }, "Spend snowflakes on permanent upgrades"), /* @__PURE__ */ React.createElement("div", { className: "bg-white/5 rounded-xl p-3 mb-4 text-[11px] text-slate-300 grid grid-cols-2 gap-1" }, /* @__PURE__ */ React.createElement("span", null, "HP: ", stats.maxHp), /* @__PURE__ */ React.createElement("span", null, "Ammo: ", stats.maxAmmo), /* @__PURE__ */ React.createElement("span", null, "Reload: ", stats.reloadTime, "ms"), /* @__PURE__ */ React.createElement("span", null, "Start Wave: ", stats.startWave), /* @__PURE__ */ React.createElement("span", null, "Damage: ", stats.damage)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, Object.entries(UPGRADE_DEFS).map(([key, def]) => {
    const level = upgrades[key];
    const maxed = level >= def.maxLevel;
    const cost = maxed ? 0 : getUpgradeCost(key, level);
    const canAfford = snowflakes >= cost;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key,
        onClick: () => handleBuy(key),
        disabled: maxed || !canAfford,
        className: "shop-item w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0",
          dangerouslySetInnerHTML: { __html: def.icon }
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm" }, def.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-mono" }, "Lv.", level, "/", def.maxLevel)), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, def.desc), /* @__PURE__ */ React.createElement("div", { className: "flex gap-0.5 mt-1.5" }, Array.from({ length: def.maxLevel }, (_, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `h-1 flex-1 rounded-full ${i < level ? "bg-cyan-400" : "bg-white/10"}` })))),
      /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 text-right" }, maxed ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-400" }, "MAX") : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-cyan-300 text-sm" }, "❄"), /* @__PURE__ */ React.createElement("span", { className: `font-mono font-bold text-sm ${canAfford ? "text-white" : "text-red-400"}` }, cost)))
    );
  }))));
};
const HomeView = ({ onCampaign, onEndless, onShop, bestScore, snowflakes, selectedBiome, setSelectedBiome, unlockedBiomes, launcher, setLauncher }) => /* @__PURE__ */ React.createElement("div", { className: "snow-home w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-white px-6 py-5 overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "mb-4 text-center" }, /* @__PURE__ */ React.createElement("h1", { className: "text-5xl font-black mb-2 tracking-tighter drop-shadow-lg" }, "SNOWMAN", /* @__PURE__ */ React.createElement("br", null), "SIEGE"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 font-medium uppercase tracking-widest text-xs" }, "Winter Arcade Defense")), /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-xl space-y-3 flex flex-col items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full grid grid-cols-2 md:grid-cols-4 gap-2" }, WINTER_BIOMES.map((biome, i) => /* @__PURE__ */ React.createElement("button", { key: biome.name, disabled: i > unlockedBiomes, onClick: () => setSelectedBiome(i), className: `rounded-xl border p-2 text-xs ${selectedBiome === i ? "border-cyan-300 bg-cyan-400/20" : "border-white/10 bg-white/5"} disabled:opacity-30` }, /* @__PURE__ */ React.createElement("span", { className: "text-xl block" }, i > unlockedBiomes ? "🔒" : biome.icon), /* @__PURE__ */ React.createElement("b", null, biome.name), /* @__PURE__ */ React.createElement("small", { className: "block text-[9px] text-white/50 mt-1" }, "Wave ", biome.goalWave, " · ", biome.objective)))), /* @__PURE__ */ React.createElement("div", { className: "w-full grid grid-cols-2 md:grid-cols-4 gap-2" }, Object.entries(LAUNCHERS).map(([id, item]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => setLauncher(id), className: `rounded-xl border p-2 text-xs ${launcher === id ? "border-yellow-300 bg-yellow-400/15" : "border-white/10 bg-white/5"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, item.icon), " ", /* @__PURE__ */ React.createElement("b", null, item.name), /* @__PURE__ */ React.createElement("small", { className: "block text-[9px] text-white/50" }, item.desc)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: onCampaign, className: "bg-white text-slate-900 font-bold px-7 py-3 rounded-full text-lg shadow-xl active:scale-95 transition-transform" }, "CAMPAIGN"), /* @__PURE__ */ React.createElement("button", { onClick: onEndless, className: "bg-indigo-500/30 border border-indigo-300/30 text-white font-bold px-7 py-3 rounded-full text-lg active:scale-95" }, "ENDLESS")), /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onShop,
    className: "w-48 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold py-3 rounded-full text-base shadow-lg active:scale-95 transition-transform"
  },
  "❄ SHOP"
), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-xs font-bold uppercase mb-1" }, "Best Score"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-mono text-yellow-400" }, bestScore.toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "w-px h-8 bg-white/10" }), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-xs font-bold uppercase mb-1" }, "Snowflakes"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-mono text-cyan-300" }, "❄ ", snowflakes.toLocaleString())))), /* @__PURE__ */ React.createElement("div", { className: "mt-4 text-center text-slate-500 text-[10px] leading-relaxed max-w-[260px]" }, "HOLD TO FIRE • RELEASE TO RELOAD", /* @__PURE__ */ React.createElement("br", null), "DEFEND THE VILLAGE FROM THE FROZEN HORDE"));
const GameOverView = ({ score, bestScore, snowflakesEarned, gameStats, onRestart, onHome }) => {
  const accuracy = gameStats && gameStats.shotsFired > 0 ? Math.round(gameStats.shotsHit / gameStats.shotsFired * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 z-50 overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-6" }, /* @__PURE__ */ React.createElement("h2", { className: `${gameStats?.completed ? "text-emerald-400" : "text-red-500"} text-5xl font-black italic tracking-tighter mb-2` }, gameStats?.completed ? "MISSION CLEAR!" : "GAME OVER"), /* @__PURE__ */ React.createElement("p", { className: "text-white/40 uppercase tracking-widest text-xs" }, gameStats?.completed ? "The winter road is open" : "The siege has broken through")), /* @__PURE__ */ React.createElement("div", { className: "bg-white/5 w-full rounded-3xl p-6 mb-4 text-center space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-white/40 text-[10px] uppercase font-bold" }, "Final Score"), /* @__PURE__ */ React.createElement("p", { className: "text-white text-4xl font-mono font-bold" }, score.toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/40 text-[10px] uppercase font-bold" }, "Best Record"), /* @__PURE__ */ React.createElement("p", { className: "text-yellow-400 text-2xl font-mono font-bold" }, bestScore.toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-white/10" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/40 text-[10px] uppercase font-bold" }, "Snowflakes Earned"), /* @__PURE__ */ React.createElement("p", { className: "text-cyan-300 text-2xl font-mono font-bold" }, "❄ +", snowflakesEarned.toLocaleString()))), gameStats && /* @__PURE__ */ React.createElement("div", { className: "bg-white/5 w-full rounded-3xl p-4 mb-6" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/50 text-[10px] uppercase font-bold tracking-widest text-center mb-3" }, "Battle Statistics"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/30 text-[9px] uppercase font-bold" }, "Enemies Killed"), /* @__PURE__ */ React.createElement("p", { className: "text-white text-lg font-mono font-bold" }, gameStats.enemiesKilled)), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/30 text-[9px] uppercase font-bold" }, "Accuracy"), /* @__PURE__ */ React.createElement("p", { className: `text-lg font-mono font-bold ${accuracy >= 50 ? "text-green-400" : accuracy >= 25 ? "text-yellow-400" : "text-red-400"}` }, accuracy, "%")), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/30 text-[9px] uppercase font-bold" }, "Best Combo"), /* @__PURE__ */ React.createElement("p", { className: "text-orange-400 text-lg font-mono font-bold" }, gameStats.highestCombo, " hits")), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/30 text-[9px] uppercase font-bold" }, "Waves Survived"), /* @__PURE__ */ React.createElement("p", { className: "text-blue-400 text-lg font-mono font-bold" }, gameStats.wavesSurvived)), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 text-center pt-1 border-t border-white/5" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/30 text-[9px] uppercase font-bold" }, "Power-Ups Collected"), /* @__PURE__ */ React.createElement("p", { className: "text-purple-400 text-lg font-mono font-bold" }, gameStats.powerUpsCollected)))), /* @__PURE__ */ React.createElement("div", { className: "w-full flex flex-col gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRestart,
      className: "w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
    },
    "RETRY"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onHome,
      className: "w-full bg-white/10 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform"
    },
    "HOME"
  )));
};
const GameHUDView = ({ status, onPause, gameConfig }) => {
  const hpCores = Array.from({ length: status.maxHp }, (_, i) => i < status.hp);
  const biome = WINTER_BIOMES[gameConfig.biome] || WINTER_BIOMES[0];
  return /* @__PURE__ */ React.createElement("div", { className: "snow-hud absolute inset-0 pointer-events-none p-4 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "snow-topbar flex justify-between items-start pt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col max-[400px]:pt-10" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/50 text-[10px] font-bold uppercase tracking-widest" }, "Score"), /* @__PURE__ */ React.createElement("p", { className: "text-white text-2xl font-mono leading-none" }, status.score.toLocaleString()), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-[10px] font-mono mt-0.5" }, "Wave ", status.wave)), /* @__PURE__ */ React.createElement(
    "button",
    {
      "aria-label": "Pause game",
      onClick: onPause,
      className: "pointer-events-auto bg-white/10 backdrop-blur-md p-2 rounded-xl active:scale-90"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "white" }, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "5", width: "4", height: "14", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "5", width: "4", height: "14", rx: "1" }))
  )), /* @__PURE__ */ React.createElement("div", { className: "snow-objective text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-cyan-200 text-[10px] font-black uppercase" }, gameConfig.mode === "campaign" ? `${biome.icon} ${biome.name}` : "♾️ Endless Siege", " · ", LAUNCHERS[gameConfig.launcher]?.name), gameConfig.mode === "campaign" && /* @__PURE__ */ React.createElement("p", { className: "text-white/60 text-[9px]" }, "Goal: Wave ", biome.goalWave, " + ", biome.objective)), /* @__PURE__ */ React.createElement("div", { className: "snow-footer flex flex-col gap-4 pb-4" }, status.reloading && /* @__PURE__ */ React.createElement("div", { className: "w-full h-1.5 bg-black/40 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "h-full bg-yellow-400 transition-all duration-75",
      style: { width: `${status.reloadProgress * 100}%` }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-end" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 flex-wrap", style: { maxWidth: "180px" } }, hpCores.map((active, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: `w-4 h-6 rounded-sm border-2 transition-colors ${active ? "bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-transparent border-white/20"}`
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end" }, /* @__PURE__ */ React.createElement("p", { className: "text-white/50 text-[10px] font-bold uppercase tracking-widest" }, "Ammo"), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1" }, /* @__PURE__ */ React.createElement("span", { className: `text-2xl font-mono leading-none ${status.ammo < 10 ? "text-red-500" : "text-white"}` }, status.ammo), /* @__PURE__ */ React.createElement("span", { className: "text-white/40 text-sm font-mono" }, "/ ", status.maxAmmo)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-center" }, status.rapidFireActive && /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-500/30 border border-yellow-400/50 rounded-lg px-2 py-0.5 text-[10px] font-bold text-yellow-300" }, "RAPID"), status.spreadShotActive && /* @__PURE__ */ React.createElement("div", { className: "bg-blue-500/30 border border-blue-400/50 rounded-lg px-2 py-0.5 text-[10px] font-bold text-blue-300" }, "SPREAD"), status.freezeActive && /* @__PURE__ */ React.createElement("div", { className: "bg-cyan-500/30 border border-cyan-400/50 rounded-lg px-2 py-0.5 text-[10px] font-bold text-cyan-300" }, "FREEZE"))));
};
const WaveBannerOverlay = ({ waveBanner }) => {
  if (!waveBanner || !waveBanner.text) return null;
  const isExiting = waveBanner.phase === "exit";
  return /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 pointer-events-none flex items-center justify-center z-30" }, /* @__PURE__ */ React.createElement("div", { className: isExiting ? "wave-banner-exit" : "wave-banner-enter" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-white text-5xl font-black italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" }, waveBanner.text), waveBanner.subtext && /* @__PURE__ */ React.createElement("p", { className: "text-white/60 text-sm font-bold uppercase tracking-widest mt-2" }, waveBanner.subtext))));
};
const ComboOverlay = ({ combo }) => {
  if (!combo || combo.multiplier <= 1) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "absolute pointer-events-none z-20",
      style: { left: `${combo.screenX}%`, top: `${combo.screenY}%`, transform: "translate(-50%, -130%)" }
    },
    /* @__PURE__ */ React.createElement("div", { className: combo.justIncreased ? "combo-pop" : "", key: combo.multiplier }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "text-yellow-300 font-black text-2xl drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]",
        style: { WebkitTextStroke: "1px rgba(0,0,0,0.3)" }
      },
      "x",
      combo.multiplier
    ), /* @__PURE__ */ React.createElement("div", { className: "text-center text-[9px] text-yellow-300/60 font-bold" }, combo.hits, " HITS"))
  );
};
function fitWinterField(width, height, topInset = 0, bottomInset = 0) {
  const scale = Math.min(width / 600, Math.max(1, height - topInset - bottomInset) / 800);
  return { width, height, scale, x: (width - 600 * scale) / 2, y: height - bottomInset - 800 * scale };
}
const GameContainerView = ({ onGameOver, upgrades, gameConfig }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(fitWinterField(GAME_WIDTH, GAME_HEIGHT));
  const effectiveStats = getEffectiveStats(upgrades);
  const biome = WINTER_BIOMES[gameConfig.biome] || WINTER_BIOMES[0];
  const launcher = LAUNCHERS[gameConfig.launcher] || LAUNCHERS.rapid;
  const [status, setStatus] = useState({
    score: 0,
    hp: effectiveStats.maxHp,
    maxHp: effectiveStats.maxHp,
    ammo: effectiveStats.maxAmmo,
    maxAmmo: effectiveStats.maxAmmo,
    reloading: false,
    reloadProgress: 0,
    wave: effectiveStats.startWave,
    isPaused: false,
    rapidFireActive: false,
    spreadShotActive: false,
    freezeActive: false
  });
  const [waveBanner, setWaveBanner] = useState(null);
  const [comboDisplay, setComboDisplay] = useState(null);
  const stateRef = useRef({
    hp: effectiveStats.maxHp,
    maxHp: effectiveStats.maxHp,
    score: 0,
    ammo: effectiveStats.maxAmmo,
    maxAmmo: effectiveStats.maxAmmo,
    reloading: false,
    reloadStartTime: 0,
    reloadTime: effectiveStats.reloadTime,
    lastFireTime: 0,
    lastFrameTime: Date.now(),
    lastSpawnTime: 0,
    lastWaveTime: Date.now(),
    isPaused: false,
    pausedAt: 0,
    isMouseDown: false,
    activePointerId: null,
    mousePos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    wave: effectiveStats.startWave,
    damage: effectiveStats.damage,
    enemies: [],
    projectiles: [],
    particles: [],
    powerUps: [],
    screenShake: 0,
    backgroundSnow: [],
    // Combo system
    comboHits: 0,
    comboMultiplier: 1,
    comboJustIncreased: false,
    comboAnimTimer: 0,
    // Power-up timers
    rapidFireEndTime: 0,
    spreadShotEndTime: 0,
    freezeEndTime: 0,
    // Wave system
    waveTransitioning: false,
    waveSpawnPauseEnd: 0,
    waveBannerShown: false,
    themedWave: null,
    // Initial wave shown
    initialBannerShown: false,
    // Parallax background layers (generated on init)
    parallaxLayers: [],
    // Melt animation arrays
    meltingEnemies: [],
    // enemies currently melting (0.3s animation)
    snowPuddles: [],
    // puddles left behind after melt (fade over ~3s)
    // Night/day cycle
    stars: [],
    nightCycleTransition: 0,
    // 0 = day/dusk, 1 = night
    // Enemy spawn warnings
    pendingSpawns: [],
    // { x, warnTime, spawnTime, type }
    // Game stats tracking
    totalEnemiesKilled: 0,
    totalShotsFired: 0,
    totalShotsHit: 0,
    highestCombo: 0,
    powerUpsCollected: 0,
    bossesDefeated: 0,
    wave10BossDefeated: false,
    bossSpawnedWave: 0,
    missionComplete: false,
    launcherId: gameConfig.launcher
  });
  const requestRef = useRef();
  const waveBannerTimeoutRef = useRef();
  const lastStatusRef = useRef({});
  useEffect(() => {
    stateRef.current.backgroundSnow = Array.from({ length: 50 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      s: 1 + Math.random() * 2
    }));
    const generateMountainPoints = (baseY, peakMin, peakMax, segments) => {
      const pts = [];
      const segW = GAME_WIDTH / segments;
      for (let i = 0; i <= segments; i++) {
        pts.push({ x: i * segW, y: baseY - (peakMin + Math.random() * (peakMax - peakMin)) });
      }
      return pts;
    };
    const generateTreePositions = (count, yMin, yMax) => {
      const trees = [];
      for (let i = 0; i < count; i++) {
        trees.push({
          x: Math.random() * GAME_WIDTH,
          y: yMin + Math.random() * (yMax - yMin),
          h: 20 + Math.random() * 30,
          w: 8 + Math.random() * 10
        });
      }
      return trees.sort((a, b) => a.y - b.y);
    };
    stateRef.current.parallaxLayers = [
      { depth: 0.02, color: "#1a2a3a", mountains: generateMountainPoints(520, 60, 120, 6), trees: [] },
      { depth: 0.04, color: "#1e3040", mountains: generateMountainPoints(540, 40, 90, 8), trees: generateTreePositions(12, 470, 520) },
      { depth: 0.06, color: "#243444", mountains: [], trees: generateTreePositions(8, 500, 540) }
    ];
    stateRef.current.stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT * 0.6),
      size: 0.5 + Math.random() * 2,
      twinkleSpeed: 2e-3 + Math.random() * 5e-3,
      twinkleOffset: Math.random() * Math.PI * 2
    }));
    showWaveBanner(stateRef.current.wave);
  }, []);
  const showWaveBanner = (waveNum) => {
    const themed = THEMED_WAVES[waveNum];
    const isBoss = waveNum % 5 === 0;
    const text = isBoss ? `BOSS WAVE ${waveNum}` : themed ? themed.name : `WAVE ${waveNum}`;
    const subtext = isBoss ? "Watch the glowing weak point!" : themed ? themed.subtext : waveNum > 1 ? "Enemies grow stronger!" : `${biome.name}: ${biome.objective}`;
    setWaveBanner({ text, subtext, phase: "enter" });
    if (waveBannerTimeoutRef.current) clearTimeout(waveBannerTimeoutRef.current);
    waveBannerTimeoutRef.current = setTimeout(() => {
      setWaveBanner((prev) => prev ? { ...prev, phase: "exit" } : null);
      waveBannerTimeoutRef.current = setTimeout(() => {
        setWaveBanner(null);
      }, 500);
    }, 2e3);
  };
  const getGamePos = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const frame = frameRef.current;
    return {
      x: (e.clientX - rect.left - frame.x) / frame.scale,
      y: (e.clientY - rect.top - frame.y) / frame.scale
    };
  };
  const updateMousePos = (e) => {
    const pos = getGamePos(e);
    if (pos) stateRef.current.mousePos = pos;
  };
  const handlePointerDown = useCallback((e) => {
    initAudio();
    const s = stateRef.current;
    if (s.isPaused) return;
    if (s.activePointerId != null && e.pointerId !== s.activePointerId) return;
    s.activePointerId = e.pointerId;
    s.isMouseDown = true;
    updateMousePos(e);
    const pos = getGamePos(e);
    if (pos) {
      for (let i = s.powerUps.length - 1; i >= 0; i--) {
        const pu = s.powerUps[i];
        const dist = Math.sqrt((pos.x - pu.x) ** 2 + (pos.y - pu.y) ** 2);
        if (dist < 30) {
          collectPowerUp(pu);
          s.powerUps.splice(i, 1);
          break;
        }
      }
    }
  }, []);
  const handlePointerUp = useCallback((e) => {
    const s = stateRef.current;
    if (s.activePointerId != null && e.pointerId !== s.activePointerId) return;
    s.activePointerId = null;
    s.isMouseDown = false;
    if (s.ammo < s.maxAmmo && !s.reloading) {
      s.reloading = true;
      s.reloadStartTime = Date.now();
      playSound(200, "sine", 0.5, 0.05);
    }
  }, []);
  const handlePointerMove = useCallback((e) => {
    const s = stateRef.current;
    if (s.activePointerId != null && e.pointerId !== s.activePointerId) return;
    updateMousePos(e);
  }, []);
  const togglePause = useCallback(() => {
    const s = stateRef.current;
    const now = Date.now();
    if (!s.isPaused) {
      s.pausedAt = now;
    } else {
      const delta = now - (s.pausedAt || now);
      s.lastWaveTime += delta;
      s.lastSpawnTime += delta;
      s.lastFireTime += delta;
      s.lastFrameTime += delta;
      s.reloadStartTime += delta;
      s.rapidFireEndTime += delta;
      s.spreadShotEndTime += delta;
      s.freezeEndTime += delta;
      s.waveSpawnPauseEnd += delta;
      s.comboAnimTimer += delta;
      s.enemies.forEach((en) => {
        en.spawnTime += delta;
        en.chargeTimer += delta;
        en.chargeEndTime += delta;
        en.strafeTimer += delta;
        en.lastThrowTime += delta;
        if (en.critFlashTime) en.critFlashTime += delta;
      });
      s.pendingSpawns.forEach((ps) => {
        ps.warnTime += delta;
        ps.spawnTime += delta;
      });
      s.powerUps.forEach((pu) => {
        pu.spawnTime += delta;
      });
      s.meltingEnemies.forEach((me) => {
        me.meltStart += delta;
      });
      s.snowPuddles.forEach((pd) => {
        pd.spawnTime += delta;
      });
    }
    s.isPaused = !s.isPaused;
    setStatus((prev) => ({ ...prev, isPaused: s.isPaused }));
  }, []);
  const spawnParticles = (x, y, color, count, velocityMult = 1) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10 * velocityMult,
        vy: (Math.random() - 0.5) * 10 * velocityMult,
        life: 0.5 + Math.random() * 0.5,
        color
      });
    }
  };
  const shake = (amount) => {
    stateRef.current.screenShake = amount;
    if (window.navigator.vibrate) window.navigator.vibrate(Math.min(amount * 5, 100));
  };
  const collectPowerUp = (pu) => {
    const s = stateRef.current;
    const now = Date.now();
    const config = POWER_UP_CONFIG[pu.type];
    s.powerUpsCollected += 1;
    playSound(700, "sine", 0.15, 0.06);
    spawnParticles(pu.x, pu.y, config.color, 8, 1.5);
    switch (pu.type) {
      case PowerUpType.HEALTH:
        s.hp = Math.min(s.hp + 1, s.maxHp);
        break;
      case PowerUpType.RAPID_FIRE:
        s.rapidFireEndTime = now + config.duration;
        break;
      case PowerUpType.SPREAD_SHOT:
        s.spreadShotEndTime = now + config.duration;
        break;
      case PowerUpType.FREEZE_BOMB:
        s.freezeEndTime = now + config.duration;
        spawnParticles(GAME_WIDTH / 2, GAME_HEIGHT / 2, "#00d2d3", 25, 3);
        playSound(200, "triangle", 0.4, 0.08);
        break;
    }
  };
  const spawnPowerUp = (x, y) => {
    if (Math.random() > POWER_UP_DROP_CHANCE) return;
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    stateRef.current.powerUps.push({
      id: Math.random().toString(),
      type,
      x,
      y,
      spawnTime: Date.now()
    });
  };
  const getComboMultiplier = (hits) => {
    for (const tier of COMBO_TIERS) {
      if (hits >= tier.hits) return tier.multiplier;
    }
    return 1;
  };
  const resetCombo = () => {
    const s = stateRef.current;
    s.comboHits = 0;
    s.comboMultiplier = 1;
    s.comboJustIncreased = false;
  };
  const registerHit = () => {
    const s = stateRef.current;
    s.comboHits += 1;
    if (s.comboHits > s.highestCombo) s.highestCombo = s.comboHits;
    const newMult = getComboMultiplier(s.comboHits);
    if (newMult > s.comboMultiplier) {
      s.comboJustIncreased = true;
      s.comboAnimTimer = Date.now();
      playSound(800 + newMult * 100, "triangle", 0.15, 0.06);
    }
    s.comboMultiplier = newMult;
  };
  const update = useCallback(() => {
    const s = stateRef.current;
    if (document.hidden) return;
    if (s.isPaused) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const now = Date.now();
    const dt = Math.min(50, now - s.lastFrameTime) / (1e3 / 60);
    s.lastFrameTime = now;
    if (s.comboJustIncreased && now - s.comboAnimTimer > 300) {
      s.comboJustIncreased = false;
    }
    const rapidFireActive = now < s.rapidFireEndTime;
    const spreadShotActive = now < s.spreadShotEndTime;
    const freezeActive = now < s.freezeEndTime;
    const currentFireRate = BASE_FIRE_RATE * launcher.rate * (rapidFireActive ? 0.5 : 1);
    if (now - s.lastWaveTime > WAVE_INTERVAL) {
      s.wave += 1;
      s.lastWaveTime = now;
      s.waveTransitioning = true;
      s.waveSpawnPauseEnd = now + 2500;
      playSound(400 + s.wave * 50, "triangle", 0.3, 0.05);
      s.themedWave = THEMED_WAVES[s.wave] || null;
      showWaveBanner(s.wave);
    }
    if (s.waveTransitioning && now >= s.waveSpawnPauseEnd) {
      s.waveTransitioning = false;
    }
    if (!s.waveTransitioning && s.wave % 5 === 0 && s.bossSpawnedWave !== s.wave) {
      s.bossSpawnedWave = s.wave;
      const stats = ENEMY_STATS.BOSS;
      s.enemies.push({
        id: "boss-" + s.wave,
        type: EnemyType.BOSS,
        boss: true,
        bossStyle: (s.wave / 5 - 1) % 4,
        x: GAME_WIDTH / 2,
        y: -100,
        hp: stats.hp + s.wave * 7,
        maxHp: stats.hp + s.wave * 7,
        speed: stats.speed,
        baseSpeed: stats.speed,
        points: stats.points + s.wave * 100,
        radius: stats.radius,
        spawnTime: now,
        spawnX: GAME_WIDTH / 2,
        sineAmplitude: GAME_WIDTH * 0.26,
        sineFrequency: 11e-4,
        lastThrowTime: now + 900,
        weakAngle: 0,
        weakRadius: stats.radius * 0.68,
        chargeTimer: now + 2500,
        isCharging: false,
        chargeEndTime: 0,
        strafeDir: 1,
        strafeTimer: now
      });
      playSound(70, "sawtooth", 0.8, 0.1);
    }
    s.backgroundSnow.forEach((sn) => {
      sn.y += sn.s * dt;
      if (sn.y > GAME_HEIGHT) sn.y = -10;
    });
    if (!s.waveTransitioning) {
      const spawnRate = Math.max(450, 2200 - s.wave * 180);
      const SPAWN_WARN_TIME = 500;
      if (now - s.lastSpawnTime > spawnRate) {
        let type = EnemyType.BASIC;
        if (s.themedWave && s.themedWave.spawnBias) {
          const roll = Math.random();
          const bias = s.themedWave.spawnBias;
          let cumulative = 0;
          for (const [etype, chance] of Object.entries(bias)) {
            cumulative += chance;
            if (roll <= cumulative) {
              type = EnemyType[etype];
              break;
            }
          }
        } else {
          const typeRoll = Math.random();
          if (s.wave >= 2 && typeRoll > 0.7) type = EnemyType.THROWER;
          if (s.wave >= 3 && typeRoll > 0.85) type = EnemyType.CHUNKY;
        }
        const stats = ENEMY_STATS[type];
        const spawnX = stats.radius + Math.random() * (GAME_WIDTH - stats.radius * 2);
        s.pendingSpawns.push({
          x: spawnX,
          type,
          warnTime: now,
          spawnTime: now + SPAWN_WARN_TIME
        });
        s.lastSpawnTime = now;
      }
    }
    for (let i = s.pendingSpawns.length - 1; i >= 0; i--) {
      const ps = s.pendingSpawns[i];
      if (now >= ps.spawnTime) {
        const stats = ENEMY_STATS[ps.type];
        s.enemies.push({
          id: Math.random().toString(),
          type: ps.type,
          x: ps.x,
          y: -stats.radius * 2,
          hp: stats.hp,
          maxHp: stats.hp,
          speed: stats.speed + s.wave * 0.08,
          baseSpeed: stats.speed + s.wave * 0.08,
          lastThrowTime: now + Math.random() * 2e3,
          points: stats.points,
          radius: stats.radius,
          // Movement pattern data
          spawnTime: now,
          spawnX: ps.x,
          sineAmplitude: 30 + Math.random() * 40,
          sineFrequency: 1e-3 + Math.random() * 2e-3,
          chargeTimer: now + 2e3 + Math.random() * 3e3,
          isCharging: false,
          chargeEndTime: 0,
          strafeDir: Math.random() > 0.5 ? 1 : -1,
          strafeTimer: now + 1e3 + Math.random() * 2e3
        });
        s.pendingSpawns.splice(i, 1);
      }
    }
    if (s.isMouseDown && !s.reloading && s.ammo > 0) {
      if (now - s.lastFireTime > currentFireRate) {
        const originX = GAME_WIDTH / 2;
        const originY = GAME_HEIGHT - 60;
        const dx = s.mousePos.x - originX;
        const dy = s.mousePos.y - originY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const baseVx = dx / dist * launcher.speed;
        const baseVy = dy / dist * launcher.speed;
        if (spreadShotActive) {
          const spreadAngle = 0.15;
          for (let k = -1; k <= 1; k++) {
            const angle = Math.atan2(baseVy, baseVx) + k * spreadAngle;
            s.projectiles.push({
              id: Math.random().toString(),
              x: originX,
              y: originY,
              vx: Math.cos(angle) * launcher.speed,
              vy: Math.sin(angle) * launcher.speed,
              isPlayerOwned: true,
              radius: launcher.radius,
              damage: s.damage * launcher.damage,
              launcher: s.launcherId,
              splash: launcher.splash || 0,
              bounces: launcher.bounces || 0,
              homing: !!launcher.homing
            });
          }
        } else {
          s.projectiles.push({
            id: Math.random().toString(),
            x: originX,
            y: originY,
            vx: baseVx,
            vy: baseVy,
            isPlayerOwned: true,
            radius: launcher.radius,
            damage: s.damage * launcher.damage,
            launcher: s.launcherId,
            splash: launcher.splash || 0,
            bounces: launcher.bounces || 0,
            homing: !!launcher.homing
          });
        }
        playSound(800 + Math.random() * 100, "square", 0.05, 0.03);
        s.ammo -= 1;
        s.totalShotsFired += spreadShotActive ? 3 : 1;
        s.lastFireTime = now;
        if (s.ammo <= 0) {
          s.reloading = true;
          s.reloadStartTime = now;
          playSound(150, "sine", 0.4, 0.05);
        }
      }
    }
    if (s.reloading) {
      const elapsed = now - s.reloadStartTime;
      const progress = Math.min(1, elapsed / s.reloadTime);
      if (progress >= 1) {
        s.ammo = s.maxAmmo;
        s.reloading = false;
        playSound(600, "sine", 0.1, 0.05);
      }
    }
    let missedShot = false;
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const p = s.projectiles[i];
      if (!p) continue;
      if (p.isPlayerOwned && p.homing && s.enemies.length) {
        const target = s.enemies.reduce((best, enemy) => {
          const d = (enemy.x - p.x) ** 2 + (enemy.y - p.y) ** 2;
          return !best || d < best.d ? { enemy, d } : best;
        }, null)?.enemy;
        if (target) {
          const speed = Math.hypot(p.vx, p.vy), desired = Math.atan2(target.y - p.y, target.x - p.x), current = Math.atan2(p.vy, p.vx);
          let turn = (desired - current + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          const angle = current + Math.max(-0.055, Math.min(0.055, turn)) * dt;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.isPlayerOwned && p.bounces > 0 && (p.x < p.radius || p.x > GAME_WIDTH - p.radius)) {
        p.x = Math.max(p.radius, Math.min(GAME_WIDTH - p.radius, p.x));
        p.vx *= -1;
        p.bounces--;
        playSound(520, "triangle", 0.04, 0.025);
      }
      if (p.x < -100 || p.x > GAME_WIDTH + 100 || p.y < -100 || p.y > GAME_HEIGHT + 100) {
        if (p.isPlayerOwned) missedShot = true;
        s.projectiles.splice(i, 1);
        continue;
      }
      if (p.isPlayerOwned) {
        let hit = false;
        for (let j = s.enemies.length - 1; j >= 0; j--) {
          const e = s.enemies[j];
          const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
          if (dist < e.radius + p.radius) {
            let dmg = p.damage || s.damage;
            let weakHit = true;
            if (e.boss) {
              const weakX = e.x + Math.cos(e.weakAngle) * e.weakRadius, weakY = e.y + Math.sin(e.weakAngle) * e.weakRadius - e.radius * 0.45;
              weakHit = Math.hypot(p.x - weakX, p.y - weakY) < 18 + p.radius;
              if (!weakHit) dmg *= 0.18;
              else {
                dmg *= 1.55;
                spawnParticles(weakX, weakY, "#fef08a", 12, 2.4);
                playSound(920, "square", 0.08, 0.06);
              }
            }
            const isCrit = Math.random() < 0.05;
            if (isCrit) {
              dmg *= 2;
              e.critFlashTime = now;
              playSound(150, "square", 0.15, 0.1);
              playSound(600, "sawtooth", 0.1, 0.08);
              spawnParticles(p.x, p.y, "#f1c40f", 8, 2);
            }
            e.hp -= dmg;
            if (p.splash) {
              s.enemies.forEach((other) => {
                if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < p.splash) other.hp -= dmg * 0.55;
              });
              spawnParticles(e.x, e.y, "#93c5fd", 18, 2.5);
              shake(12);
            }
            spawnParticles(p.x, p.y, COLORS.SNOW, 4);
            if (!isCrit) playSound(300 + Math.random() * 200, "sawtooth", 0.05, 0.04);
            s.projectiles.splice(i, 1);
            hit = true;
            s.totalShotsHit += 1;
            registerHit();
            if (e.hp <= 0) {
              if (e.boss) {
                s.bossesDefeated += 1;
                if (e.id === "boss-10") s.wave10BossDefeated = true;
              }
              s.totalEnemiesKilled += 1;
              const pointsEarned = e.points * s.comboMultiplier;
              s.score += pointsEarned;
              spawnParticles(e.x, e.y, COLORS.SNOW, 15, 2);
              shake(8);
              playSound(100, "square", 0.2, 0.08);
              spawnPowerUp(e.x, e.y);
              s.meltingEnemies.push({
                x: e.x,
                y: e.y,
                radius: e.radius,
                type: e.type,
                meltStart: now,
                meltDuration: 300
                // 0.3 seconds
              });
              s.enemies.splice(j, 1);
            }
            break;
          }
        }
        if (hit) continue;
        let intercepted = false;
        for (let j = s.projectiles.length - 1; j >= 0; j--) {
          const ep = s.projectiles[j];
          if (ep === p || ep.isPlayerOwned) continue;
          const epDist = Math.sqrt((p.x - ep.x) ** 2 + (p.y - ep.y) ** 2);
          if (epDist < p.radius + ep.radius) {
            s.score += 25;
            spawnParticles(ep.x, ep.y, COLORS.ENEMY_PROJECTILE, 6, 1.5);
            playSound(500, "triangle", 0.08, 0.05);
            s.projectiles.splice(j, 1);
            const pi = s.projectiles.indexOf(p);
            if (pi !== -1) s.projectiles.splice(pi, 1);
            if (j < i) i--;
            intercepted = true;
            break;
          }
        }
        if (intercepted) continue;
      } else {
        const playerX = GAME_WIDTH / 2;
        const playerY = GAME_HEIGHT - 60;
        const dist = Math.sqrt((p.x - playerX) ** 2 + (p.y - playerY) ** 2);
        if (dist < 50 + p.radius) {
          s.hp -= 1;
          shake(20);
          playSound(50, "square", 0.3, 0.1);
          s.projectiles.splice(i, 1);
          resetCombo();
          if (s.hp <= 0) onGameOver(s.score, {
            enemiesKilled: s.totalEnemiesKilled,
            shotsFired: s.totalShotsFired,
            shotsHit: s.totalShotsHit,
            highestCombo: s.highestCombo,
            wavesSurvived: s.wave,
            powerUpsCollected: s.powerUpsCollected
          });
        }
      }
    }
    for (let j = s.enemies.length - 1; j >= 0; j--) {
      const e = s.enemies[j];
      if (e.hp > 0) continue;
      if (e.boss) {
        s.bossesDefeated += 1;
        if (e.id === "boss-10") s.wave10BossDefeated = true;
      }
      s.totalEnemiesKilled += 1;
      s.score += e.points * s.comboMultiplier;
      spawnParticles(e.x, e.y, COLORS.SNOW, e.boss ? 35 : 15, e.boss ? 3 : 2);
      s.meltingEnemies.push({ x: e.x, y: e.y, radius: e.radius, type: e.type, meltStart: now, meltDuration: e.boss ? 650 : 300 });
      s.enemies.splice(j, 1);
      shake(e.boss ? 24 : 8);
    }
    if (missedShot) {
      resetCombo();
    }
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      const freezeMult = freezeActive ? 0.3 : 1;
      if (e.type === EnemyType.BOSS) {
        const phase = e.hp / e.maxHp > 0.66 ? 1 : e.hp / e.maxHp > 0.33 ? 2 : 3;
        e.weakAngle += (0.025 + phase * 6e-3) * dt;
        if (e.y < 145) e.y += 1.4 * freezeMult * dt;
        else {
          e.x = GAME_WIDTH / 2 + Math.sin((now - e.spawnTime) * (7e-4 + e.bossStyle * 12e-5)) * e.sineAmplitude;
          e.y = 145 + Math.sin((now - e.spawnTime) * 13e-4) * 28;
        }
        const attackGap = Math.max(650, 1900 - phase * 260 - e.bossStyle * 90);
        if (now - e.lastThrowTime > attackGap) {
          const shots = phase + 2 + e.bossStyle;
          const aim = Math.atan2(GAME_HEIGHT - 60 - e.y, GAME_WIDTH / 2 - e.x);
          for (let k = 0; k < shots; k++) {
            const spread = (k - (shots - 1) / 2) * (0.14 + e.bossStyle * 0.025);
            const angle = e.bossStyle === 1 ? e.weakAngle + k * Math.PI * 2 / shots : aim + spread;
            s.projectiles.push({ id: Math.random().toString(), x: e.x, y: e.y, vx: Math.cos(angle) * (5.8 + phase), vy: Math.sin(angle) * (5.8 + phase), isPlayerOwned: false, radius: 8 + phase });
          }
          e.lastThrowTime = now;
          playSound(115 + e.bossStyle * 35, "sawtooth", 0.24, 0.05);
          shake(5 + phase * 2);
        }
      } else if (e.type === EnemyType.BASIC) {
        const elapsed = now - e.spawnTime;
        const sineOffset = Math.sin(elapsed * e.sineFrequency) * e.sineAmplitude;
        e.x = e.spawnX + sineOffset;
        e.x = Math.max(e.radius, Math.min(GAME_WIDTH - e.radius, e.x));
        e.y += e.baseSpeed * freezeMult * dt;
      } else if (e.type === EnemyType.CHUNKY) {
        if (!e.isCharging && now >= e.chargeTimer) {
          e.isCharging = true;
          e.chargeEndTime = now + 800;
        }
        if (e.isCharging && now >= e.chargeEndTime) {
          e.isCharging = false;
          e.chargeTimer = now + 2e3 + Math.random() * 2e3;
        }
        const speedMult = e.isCharging ? 2 : 1;
        e.y += e.baseSpeed * speedMult * freezeMult * dt;
        e.x += Math.sin(now * 3e-3 + e.spawnTime) * 0.5 * freezeMult * dt;
        e.x = Math.max(e.radius, Math.min(GAME_WIDTH - e.radius, e.x));
      } else if (e.type === EnemyType.THROWER) {
        e.y += e.baseSpeed * 0.6 * freezeMult * dt;
        if (now >= e.strafeTimer) {
          e.strafeDir *= -1;
          e.strafeTimer = now + 800 + Math.random() * 1500;
        }
        e.x += e.strafeDir * 2.5 * freezeMult * dt;
        e.x = Math.max(e.radius, Math.min(GAME_WIDTH - e.radius, e.x));
        const throwInterval = Math.max(1200, 3e3 - s.wave * 100);
        if (now - e.lastThrowTime > throwInterval) {
          const dx = GAME_WIDTH / 2 + (Math.random() - 0.5) * 60 - e.x;
          const dy = GAME_HEIGHT - 60 - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          s.projectiles.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y,
            vx: dx / dist * 7,
            vy: dy / dist * 7,
            isPlayerOwned: false,
            radius: 8
          });
          playSound(400, "sine", 0.1, 0.02);
          e.lastThrowTime = now;
        }
      }
      if (e.y > DANGER_LINE_Y) {
        s.hp -= 1;
        shake(30);
        playSound(60, "sawtooth", 0.4, 0.1);
        s.enemies.splice(i, 1);
        resetCombo();
        if (s.hp <= 0) onGameOver(s.score, {
          enemiesKilled: s.totalEnemiesKilled,
          shotsFired: s.totalShotsFired,
          shotsHit: s.totalShotsHit,
          highestCombo: s.highestCombo,
          wavesSurvived: s.wave,
          powerUpsCollected: s.powerUpsCollected
        });
      }
    }
    if (gameConfig.mode === "campaign" && !s.missionComplete && s.wave >= biome.goalWave && now - s.lastWaveTime > 8e3 && biome.check(s)) {
      s.missionComplete = true;
      onGameOver(s.score + 5e3, {
        completed: true,
        biome: gameConfig.biome,
        enemiesKilled: s.totalEnemiesKilled,
        shotsFired: s.totalShotsFired,
        shotsHit: s.totalShotsHit,
        highestCombo: s.highestCombo,
        wavesSurvived: s.wave,
        powerUpsCollected: s.powerUpsCollected,
        bossesDefeated: s.bossesDefeated
      });
      return;
    }
    for (let i = s.powerUps.length - 1; i >= 0; i--) {
      const pu = s.powerUps[i];
      pu.y += POWER_UP_FALL_SPEED * dt;
      if (pu.y >= GAME_HEIGHT - 80) {
        collectPowerUp(pu);
        s.powerUps.splice(i, 1);
        continue;
      }
      if (pu.y > GAME_HEIGHT + 50) {
        s.powerUps.splice(i, 1);
      }
    }
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.03 * dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
    for (let i = s.meltingEnemies.length - 1; i >= 0; i--) {
      const me = s.meltingEnemies[i];
      const elapsed = now - me.meltStart;
      if (elapsed >= me.meltDuration) {
        s.snowPuddles.push({
          x: me.x,
          y: me.y,
          radius: me.radius * 0.8,
          spawnTime: now,
          fadeDuration: 3e3
          // fade over 3 seconds
        });
        s.meltingEnemies.splice(i, 1);
      }
    }
    for (let i = s.snowPuddles.length - 1; i >= 0; i--) {
      const puddle = s.snowPuddles[i];
      if (now - puddle.spawnTime >= puddle.fadeDuration) {
        s.snowPuddles.splice(i, 1);
      }
    }
    const cycleIndex = Math.floor((s.wave - 1) / 5);
    const isNight = cycleIndex % 2 === 1;
    const targetNight = isNight ? 1 : 0;
    s.nightCycleTransition += (targetNight - s.nightCycleTransition) * (1 - Math.pow(0.98, dt));
    const hpNow = Math.max(0, s.hp);
    const reloadProgress = s.reloading ? Math.min(1, Math.round((now - s.reloadStartTime) / s.reloadTime * 20) / 20) : 0;
    const ls = lastStatusRef.current;
    if (ls.score !== s.score || ls.hp !== hpNow || ls.maxHp !== s.maxHp || ls.ammo !== s.ammo || ls.maxAmmo !== s.maxAmmo || ls.reloading !== s.reloading || ls.reloadProgress !== reloadProgress || ls.wave !== s.wave || ls.rapidFireActive !== rapidFireActive || ls.spreadShotActive !== spreadShotActive || ls.freezeActive !== freezeActive) {
      const nextStatus = {
        score: s.score,
        hp: hpNow,
        maxHp: s.maxHp,
        ammo: s.ammo,
        maxAmmo: s.maxAmmo,
        reloading: s.reloading,
        reloadProgress,
        wave: s.wave,
        rapidFireActive,
        spreadShotActive,
        freezeActive
      };
      lastStatusRef.current = nextStatus;
      setStatus((prev) => ({ ...prev, ...nextStatus }));
    }
    if (s.comboMultiplier > 1) {
      if (canvasRef.current) {
        setComboDisplay({
          multiplier: s.comboMultiplier,
          hits: s.comboHits,
          justIncreased: s.comboJustIncreased,
          screenX: (frameRef.current.x + s.mousePos.x * frameRef.current.scale) / frameRef.current.width * 100,
          screenY: (frameRef.current.y + s.mousePos.y * frameRef.current.scale) / frameRef.current.height * 100
        });
      }
    } else {
      setComboDisplay(null);
    }
    draw(freezeActive, dt);
    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver]);
  const draw = (freezeActive, dt = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;
    const now = Date.now();
    const frame = frameRef.current;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, frame.width, frame.height);
    const nightT = s.nightCycleTransition;
    const lerpColor = (dayHex, nightHex, t) => {
      const dR = parseInt(dayHex.slice(1, 3), 16), dG = parseInt(dayHex.slice(3, 5), 16), dB = parseInt(dayHex.slice(5, 7), 16);
      const nR = parseInt(nightHex.slice(1, 3), 16), nG = parseInt(nightHex.slice(3, 5), 16), nB = parseInt(nightHex.slice(5, 7), 16);
      const r = Math.round(dR + (nR - dR) * t), g = Math.round(dG + (nG - dG) * t), b = Math.round(dB + (nB - dB) * t);
      return `rgb(${r},${g},${b})`;
    };
    const skyTop = lerpColor(biome.skyTop, "#0a0e1a", nightT);
    const skyMid = lerpColor(biome.skyBottom, "#101828", nightT);
    const skyLow = lerpColor("#1a2a3a", "#080c15", nightT);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, frame.height);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.7, skyMid);
    skyGrad.addColorStop(1, skyLow);
    ctx.fillStyle = skyGrad;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, 0, frame.width, frame.height);
    ctx.globalAlpha = 1;
    if (freezeActive) {
      ctx.fillStyle = "rgba(0, 210, 211, 0.06)";
      ctx.fillRect(0, 0, frame.width, frame.height);
    }
    ctx.setTransform(DPR * frame.scale, 0, 0, DPR * frame.scale, DPR * frame.x, DPR * frame.y);
    ctx.save();
    if (s.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * s.screenShake, (Math.random() - 0.5) * s.screenShake);
      s.screenShake *= Math.pow(0.88, dt);
    }
    if (nightT > 0.05) {
      s.stars.forEach((star) => {
        const twinkle = 0.5 + Math.sin(now * star.twinkleSpeed + star.twinkleOffset) * 0.5;
        ctx.globalAlpha = nightT * twinkle * 0.8;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    s.backgroundSnow.forEach((sn) => {
      ctx.beginPath();
      ctx.arc(sn.x, sn.y, sn.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.DANGER;
    ctx.strokeStyle = COLORS.DANGER;
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, DANGER_LINE_Y);
    ctx.lineTo(GAME_WIDTH, DANGER_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    s.projectiles.forEach((p) => {
      ctx.fillStyle = p.isPlayerOwned ? COLORS.PLAYER_PROJECTILE : COLORS.ENEMY_PROJECTILE;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      if (p.isPlayerOwned) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "white";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    s.enemies.forEach((e) => {
      const perspectiveScale = 0.5 + e.y / DANGER_LINE_Y * 0.5;
      const r = e.radius * perspectiveScale;
      ctx.save();
      ctx.translate(e.x, e.y);
      if (freezeActive) {
        ctx.globalAlpha = 0.85;
      }
      if (e.type === EnemyType.CHUNKY && e.isCharging) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#e74c3c";
      }
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(0, 10 * perspectiveScale, r, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = freezeActive ? "#d0f0f0" : "white";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.7, r * 0.6, 0, Math.PI * 2);
      ctx.arc(0, -r * 1.3, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (e.critFlashTime && now - e.critFlashTime < 200) {
        const flashAlpha = 1 - (now - e.critFlashTime) / 200;
        ctx.fillStyle = `rgba(241, 196, 15, ${flashAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.7, r * 0.6, 0, Math.PI * 2);
        ctx.arc(0, -r * 1.3, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#f1c40f";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(-r * 0.15, -r * 1.35, r * 0.08, 0, Math.PI * 2);
      ctx.arc(r * 0.15, -r * 1.35, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.3);
      ctx.lineTo(r * 0.3, -r * 1.25);
      ctx.lineTo(0, -r * 1.2);
      ctx.fill();
      if (e.type === EnemyType.CHUNKY) {
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
        ctx.arc(0, -r * 0.7, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === EnemyType.THROWER) {
        ctx.fillStyle = "#2980b9";
        ctx.fillRect(-r * 0.4, -r * 1.8, r * 0.8, r * 0.4);
        ctx.fillRect(-r * 0.6, -r * 1.5, r * 1.2, r * 0.1);
      } else if (e.type === EnemyType.BOSS) {
        const bossColors = ["#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
        ctx.strokeStyle = bossColors[e.bossStyle] || "#ef4444";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, -r * 0.5, r * 1.18, 0, Math.PI * 2);
        ctx.stroke();
        const wx = Math.cos(e.weakAngle) * e.weakRadius * perspectiveScale, wy = Math.sin(e.weakAngle) * e.weakRadius * perspectiveScale - r * 0.45;
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#fde047";
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(wx, wy, 10 + Math.sin(now * 0.01) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, r * 0.22)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`BOSS · PHASE ${e.hp / e.maxHp > 0.66 ? 1 : e.hp / e.maxHp > 0.33 ? 2 : 3}`, 0, r * 1.35);
      }
      const barWidth = r * 1.8;
      const barHeight = 4 * perspectiveScale;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(-barWidth / 2, r + 5, barWidth, barHeight);
      ctx.fillStyle = e.hp > e.maxHp * 0.5 ? "#2ecc71" : "#e74c3c";
      ctx.fillRect(-barWidth / 2, r + 5, barWidth * (e.hp / e.maxHp), barHeight);
      ctx.globalAlpha = 1;
      ctx.restore();
    });
    s.meltingEnemies.forEach((me) => {
      const elapsed = now - me.meltStart;
      const progress = Math.min(1, elapsed / me.meltDuration);
      const perspectiveScale = 0.5 + me.y / DANGER_LINE_Y * 0.5;
      const r = me.radius * perspectiveScale;
      ctx.save();
      ctx.translate(me.x, me.y);
      ctx.globalAlpha = 1 - progress * 0.7;
      ctx.scale(1 + progress * 0.4, 1 - progress * 0.7);
      ctx.fillStyle = "rgba(220, 235, 245, 0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.5 * (1 - progress), r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    s.snowPuddles.forEach((puddle) => {
      const elapsed = now - puddle.spawnTime;
      const fadeProgress = Math.min(1, elapsed / puddle.fadeDuration);
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - fadeProgress);
      ctx.fillStyle = "#d5e5f0";
      ctx.beginPath();
      ctx.ellipse(puddle.x, puddle.y, puddle.radius * 1.2, puddle.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b0c8d8";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
    s.powerUps.forEach((pu) => {
      const config = POWER_UP_CONFIG[pu.type];
      const bobble = Math.sin(now * 5e-3 + pu.x) * 3;
      const px = pu.x;
      const py = pu.y + bobble;
      const glowPulse = 0.5 + Math.sin(now * 8e-3) * 0.3;
      ctx.save();
      ctx.translate(px, py);
      ctx.shadowBlur = 15;
      ctx.shadowColor = config.color;
      ctx.globalAlpha = 0.4 + glowPulse * 0.3;
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = config.color;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (config.symbol === "heart") {
        ctx.fillText("♥", 0, 0);
      } else if (config.symbol === "bolt") {
        ctx.fillText("⚡", 0, 0);
      } else if (config.symbol === "triple") {
        ctx.fillText("≡", 0, 0);
      } else if (config.symbol === "snowflake") {
        ctx.fillText("❄", 0, 0);
      }
      ctx.restore();
    });
    s.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5 + p.life * 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    const launcherX = GAME_WIDTH / 2;
    const launcherY = GAME_HEIGHT - 30;
    const angle = Math.atan2(s.mousePos.y - launcherY, s.mousePos.x - launcherX);
    ctx.save();
    ctx.translate(launcherX, launcherY);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0f4f8";
    ctx.beginPath();
    ctx.arc(0, 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d0d8e0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#f5f8fb";
    ctx.beginPath();
    ctx.arc(0, -18, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d0d8e0";
    ctx.stroke();
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.ellipse(0, -6, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(8, -6, 5, 14);
    ctx.fillRect(8, 8, 10, 4);
    ctx.fillStyle = "#f8fbfe";
    ctx.beginPath();
    ctx.arc(0, -36, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d0d8e0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(-10, -56, 20, 16);
    ctx.fillRect(-14, -42, 28, 4);
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(-5, -38, 2, 0, Math.PI * 2);
    ctx.arc(5, -38, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(10, -33);
    ctx.lineTo(0, -31);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2c3e50";
    for (let si = -2; si <= 2; si++) {
      const smileAngle = si * 0.25 - Math.PI * 0.5;
      ctx.beginPath();
      ctx.arc(Math.cos(smileAngle) * 7, -28 - Math.sin(smileAngle) * 4, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(0, -18);
    ctx.rotate(angle);
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(32, -6);
    ctx.moveTo(30, 0);
    ctx.lineTo(35, -4);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(38, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, -18);
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-30, -10);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, -8);
    ctx.lineTo(-28, -16);
    ctx.moveTo(-27, -9);
    ctx.lineTo(-34, -12);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    s.pendingSpawns.forEach((ps) => {
      const elapsed = now - ps.warnTime;
      const warnDuration = ps.spawnTime - ps.warnTime;
      const progress = Math.min(1, elapsed / warnDuration);
      const alpha = 0.3 + Math.sin(now * 0.02) * 0.3;
      ctx.save();
      ctx.globalAlpha = alpha * (1 - progress * 0.3);
      ctx.fillStyle = "#e74c3c";
      const arrowX = ps.x;
      const arrowY = 15 + progress * 10;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 12);
      ctx.lineTo(arrowX - 8, arrowY);
      ctx.lineTo(arrowX - 3, arrowY);
      ctx.lineTo(arrowX - 3, arrowY - 10);
      ctx.lineTo(arrowX + 3, arrowY - 10);
      ctx.lineTo(arrowX + 3, arrowY);
      ctx.lineTo(arrowX + 8, arrowY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(231, 76, 60, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY + 14);
      ctx.lineTo(arrowX, arrowY + 30 + progress * 15);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
    const waveElapsed = now - s.lastWaveTime;
    const waveProgress = Math.min(1, waveElapsed / WAVE_INTERVAL);
    const barH = 3;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, GAME_WIDTH, barH);
    const barGrad = ctx.createLinearGradient(0, 0, GAME_WIDTH * waveProgress, 0);
    barGrad.addColorStop(0, "rgba(52, 152, 219, 0.8)");
    barGrad.addColorStop(1, waveProgress > 0.8 ? "rgba(231, 76, 60, 0.9)" : "rgba(46, 204, 113, 0.8)");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, GAME_WIDTH * waveProgress, barH);
    if (waveProgress > 0.01 && waveProgress < 1) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(GAME_WIDTH * waveProgress - 2, 0, 2, barH);
    }
    const chX = s.mousePos.x;
    const chY = s.mousePos.y;
    const isSpread = now < s.spreadShotEndTime;
    const isRapid = now < s.rapidFireEndTime;
    ctx.lineWidth = 2;
    if (isSpread) {
      ctx.strokeStyle = "rgba(52, 152, 219, 0.8)";
      ctx.beginPath();
      ctx.arc(chX, chY, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(chX, chY, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(chX, chY, 24, 0, Math.PI * 2);
      ctx.stroke();
      const baseAngle = Math.atan2(chY - (GAME_HEIGHT - 30), chX - GAME_WIDTH / 2);
      for (let k = -1; k <= 1; k++) {
        const a = baseAngle + k * 0.15 + Math.PI;
        ctx.beginPath();
        ctx.moveTo(chX + Math.cos(a) * 26, chY + Math.sin(a) * 26);
        ctx.lineTo(chX + Math.cos(a) * 34, chY + Math.sin(a) * 34);
        ctx.stroke();
      }
    } else if (isRapid) {
      const pulse = 14 + Math.sin(now * 0.015) * 6;
      ctx.strokeStyle = "rgba(241, 196, 15, 0.8)";
      ctx.beginPath();
      ctx.arc(chX, chY, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(241, 196, 15, 0.6)";
      ctx.beginPath();
      ctx.arc(chX, chY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(chX - 25, chY);
      ctx.lineTo(chX - 18, chY);
      ctx.moveTo(chX + 18, chY);
      ctx.lineTo(chX + 25, chY);
      ctx.moveTo(chX, chY - 25);
      ctx.lineTo(chX, chY - 18);
      ctx.moveTo(chX, chY + 18);
      ctx.lineTo(chX, chY + 25);
      ctx.stroke();
    } else {
      ctx.strokeStyle = s.reloading ? "rgba(255,0,0,0.5)" : "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(chX, chY, 18, 0, Math.PI * 2);
      ctx.moveTo(chX - 25, chY);
      ctx.lineTo(chX + 25, chY);
      ctx.moveTo(chX, chY - 25);
      ctx.lineTo(chX, chY + 25);
      ctx.stroke();
    }
    if (s.reloading) {
      ctx.fillStyle = "white";
      ctx.font = `bold ${14 / frame.scale}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("RELOADING", chX, chY + 40);
    }
    ctx.restore();
  };
  useEffect(() => {
    const refit = () => {
      const el = canvasRef.current;
      if (!el) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const root = el.parentElement;
      const origin = root.getBoundingClientRect();
      const wide = el.clientWidth >= 1e3 && el.clientWidth > el.clientHeight;
      const topPanels = [root.querySelector(".snow-topbar"), root.querySelector(".snow-objective")].filter(Boolean);
      const footer = root.querySelector(".snow-footer");
      const topInset = wide ? 0 : Math.max(...topPanels.map((panel) => panel.getBoundingClientRect().bottom - origin.top)) + 12;
      const bottomInset = wide ? 0 : el.clientHeight - (footer.getBoundingClientRect().top - origin.top) + 12;
      frameRef.current = fitWinterField(el.clientWidth, el.clientHeight, topInset, bottomInset);
      el.width = Math.round(el.clientWidth * DPR);
      el.height = Math.round(el.clientHeight * DPR);
    };
    const visibility = () => {
      cancelAnimationFrame(requestRef.current);
      if (document.hidden) {
        stateRef.current.isMouseDown = false;
        stateRef.current.activePointerId = null;
        if (!stateRef.current.isPaused) togglePause();
      } else requestRef.current = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(refit);
    observer.observe(canvasRef.current);
    for (const panel of canvasRef.current.parentElement.querySelectorAll(".snow-topbar,.snow-objective,.snow-footer")) observer.observe(panel);
    window.addEventListener("resize", refit);
    document.addEventListener("visibilitychange", visibility);
    refit();
    requestRef.current = requestAnimationFrame(update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refit);
      document.removeEventListener("visibilitychange", visibility);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (waveBannerTimeoutRef.current) clearTimeout(waveBannerTimeoutRef.current);
    };
  }, [update, togglePause]);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "snow-battlefield relative w-full h-full touch-none select-none overflow-hidden",
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerUp,
      onPointerCancel: handlePointerUp
    },
    /* @__PURE__ */ React.createElement(
      "canvas",
      {
        ref: canvasRef,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        className: "snow-canvas w-full h-full"
      }
    ),
    /* @__PURE__ */ React.createElement(GameHUDView, { status, onPause: togglePause, gameConfig }),
    /* @__PURE__ */ React.createElement(WaveBannerOverlay, { waveBanner }),
    /* @__PURE__ */ React.createElement(ComboOverlay, { combo: comboDisplay }),
    status.isPaused && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-40" }, /* @__PURE__ */ React.createElement("h2", { className: "text-white text-4xl font-black mb-8 italic" }, "PAUSED"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: togglePause,
        className: "bg-white text-slate-900 font-bold px-12 py-4 rounded-full text-xl shadow-2xl active:scale-95 transition-transform"
      },
      "RESUME"
    ))
  );
};
const App = () => {
  const [currentScreen, setCurrentScreen] = useState(Screen.HOME);
  const [lastScore, setLastScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [snowflakes, setSnowflakes] = useState(0);
  const [snowflakesEarned, setSnowflakesEarned] = useState(0);
  const [upgrades, setUpgrades] = useState(loadUpgrades());
  const [gameStats, setGameStats] = useState(null);
  const [selectedBiome, setSelectedBiome] = useState(0);
  const [unlockedBiomes, setUnlockedBiomes] = useState(() => Math.min(WINTER_BIOMES.length - 1, parseInt(localStorage.getItem("snowman_siege_biomes") || "0", 10) || 0));
  const [launcher, setLauncher] = useState(() => localStorage.getItem("snowman_siege_launcher") || "rapid");
  const [gameConfig, setGameConfig] = useState({ mode: "campaign", biome: 0, launcher: "rapid" });
  useEffect(() => {
    const saved = localStorage.getItem("snowman_siege_best_score");
    if (saved) setBestScore(parseInt(saved, 10));
    setSnowflakes(loadSnowflakes());
  }, []);
  const handleGameOver = useCallback((score, stats) => {
    setLastScore(score);
    setGameStats(stats || null);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("snowman_siege_best_score", score.toString());
    }
    const earned = Math.floor(score / 50);
    setSnowflakesEarned(earned);
    const newTotal = snowflakes + earned;
    setSnowflakes(newTotal);
    saveSnowflakes(newTotal);
    if (stats?.completed) {
      const next = Math.min(WINTER_BIOMES.length - 1, (stats.biome || 0) + 1);
      setUnlockedBiomes((value) => {
        const unlocked = Math.max(value, next);
        localStorage.setItem("snowman_siege_biomes", String(unlocked));
        return unlocked;
      });
      setSelectedBiome(next);
    }
    setCurrentScreen(Screen.GAMEOVER);
  }, [bestScore, snowflakes]);
  const startGame = (mode = "campaign") => {
    initAudio();
    localStorage.setItem("snowman_siege_launcher", launcher);
    setGameConfig({ mode, biome: selectedBiome, launcher });
    setCurrentScreen(Screen.GAME);
  };
  const goToHome = () => setCurrentScreen(Screen.HOME);
  const goToShop = () => setCurrentScreen(Screen.SHOP);
  return /* @__PURE__ */ React.createElement("div", { className: "snow-shell w-full h-screen overflow-hidden flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: `snow-stage relative w-full h-full shadow-2xl overflow-hidden ${currentScreen === Screen.GAME ? "is-playing" : ""}` }, currentScreen === Screen.HOME && /* @__PURE__ */ React.createElement(HomeView, { onCampaign: () => startGame("campaign"), onEndless: () => startGame("endless"), onShop: goToShop, bestScore, snowflakes, selectedBiome, setSelectedBiome, unlockedBiomes, launcher, setLauncher }), currentScreen === Screen.SHOP && /* @__PURE__ */ React.createElement(
    ShopView,
    {
      onBack: goToHome,
      snowflakes,
      setSnowflakes,
      upgrades,
      setUpgrades
    }
  ), currentScreen === Screen.GAME && /* @__PURE__ */ React.createElement(GameContainerView, { onGameOver: handleGameOver, upgrades, gameConfig }), currentScreen === Screen.GAMEOVER && /* @__PURE__ */ React.createElement(
    GameOverView,
    {
      score: lastScore,
      bestScore,
      snowflakesEarned,
      gameStats,
      onRestart: () => startGame(gameConfig.mode),
      onHome: goToHome
    }
  )));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(App, null), document.getElementById("root"));
