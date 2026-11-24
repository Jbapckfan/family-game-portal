// Generated from Minesweeper-pro.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const MQ_DIFFICULTIES = {
  junior: { label: "Junior", size: 7, mines: 7, medals: [45, 75] },
  classic: { label: "Classic", size: 9, mines: 10, medals: [70, 120] },
  expert: { label: "Expert", size: 12, mines: 22, medals: [150, 240] }
};
const MQ_MISSIONS = [
  { name: "First Sweep", story: "Secure the training yard", size: 7, mines: 6, medals: [50, 85] },
  { name: "Moon Base", story: "Clear a path to the rover", size: 8, mines: 8, medals: [65, 105] },
  { name: "Sock Rescue", story: "Find the missing laundry crew", size: 9, mines: 11, medals: [90, 145] },
  { name: "Raptor Nest", story: "Protect every dinosaur egg", size: 10, mines: 14, medals: [115, 180] },
  { name: "Meteor Storm", story: "Defuse the crater field", size: 11, mines: 18, medals: [145, 220] },
  { name: "Final Frontier", story: "Clear the ultimate danger zone", size: 12, mines: 24, medals: [190, 290] },
  { name: "Neon Caverns", story: "Reignite the underground grid", size: 12, mines: 26, medals: [205, 310] },
  { name: "Laundry Blackout", story: "Rescue socks from the dark cycle", size: 13, mines: 30, medals: [240, 360] },
  { name: "Master Grid", story: "Complete the grand logic gauntlet", size: 14, mines: 36, medals: [300, 450] }
];
const MQ_THEMES = {
  classic: { label: "Bomb Squad", icon: "💣", hazard: "💣", flag: "🚩", unlock: 0 },
  space: { label: "Space Slimes", icon: "👾", hazard: "👾", flag: "🚀", unlock: 1 },
  laundry: { label: "Sock Attack", icon: "🧦", hazard: "🧦", flag: "🧺", unlock: 3 },
  dino: { label: "Dino Danger", icon: "🦖", hazard: "🥚", flag: "🦴", unlock: 6 }
};
const MQ_PROFILE_KEY = "familyPortalMineQuestProfileV1";
const mqKey = (r, c) => `${r},${c}`;
function mqNeighbors(size, r, c) {
  const result = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) result.push([nr, nc]);
    }
  }
  return result;
}
function mqEmptyBoard(size) {
  return Array.from(
    { length: size },
    (_, row) => Array.from({ length: size }, (_2, col) => ({ row, col, mine: false, adjacent: 0, revealed: false, flagged: false }))
  );
}
function mqCountBoard(board) {
  const size = board.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (board[r][c].mine) {
        board[r][c].adjacent = -1;
      } else {
        board[r][c].adjacent = mqNeighbors(size, r, c).reduce((n, [nr, nc]) => n + (board[nr][nc].mine ? 1 : 0), 0);
      }
    }
  }
  return board;
}
function mqRevealForSolver(board, seeds, revealed) {
  const queue = [...seeds];
  while (queue.length) {
    const [r, c] = queue.shift();
    const key = mqKey(r, c);
    if (revealed.has(key) || board[r][c].mine) continue;
    revealed.add(key);
    if (board[r][c].adjacent === 0) {
      mqNeighbors(board.length, r, c).forEach(([nr, nc]) => {
        if (!board[nr][nc].mine && !revealed.has(mqKey(nr, nc))) queue.push([nr, nc]);
      });
    }
  }
}
function mqIsNoGuess(board, safeRow, safeCol, mineCount) {
  const revealed = /* @__PURE__ */ new Set();
  const flagged = /* @__PURE__ */ new Set();
  mqRevealForSolver(board, [[safeRow, safeCol]], revealed);
  let changed = true;
  while (changed) {
    changed = false;
    [...revealed].forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = board[r][c];
      if (cell.adjacent <= 0) return;
      const neighbors = mqNeighbors(board.length, r, c);
      const hidden = neighbors.filter(([nr, nc]) => !revealed.has(mqKey(nr, nc)) && !flagged.has(mqKey(nr, nc)));
      const knownFlags = neighbors.filter(([nr, nc]) => flagged.has(mqKey(nr, nc))).length;
      if (hidden.length && cell.adjacent - knownFlags === hidden.length) {
        hidden.forEach(([nr, nc]) => flagged.add(mqKey(nr, nc)));
        changed = true;
      } else if (hidden.length && cell.adjacent === knownFlags) {
        const before = revealed.size;
        mqRevealForSolver(board, hidden, revealed);
        if (revealed.size > before) changed = true;
      }
    });
  }
  return revealed.size === board.length * board.length - mineCount;
}
function mqGenerateNoGuess(size, mineCount, safeRow, safeCol) {
  const forbidden = /* @__PURE__ */ new Set([mqKey(safeRow, safeCol)]);
  mqNeighbors(size, safeRow, safeCol).forEach(([r, c]) => forbidden.add(mqKey(r, c)));
  for (; ; ) {
    const board = mqEmptyBoard(size);
    const spots = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) if (!forbidden.has(mqKey(r, c))) spots.push([r, c]);
    }
    for (let i = spots.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    spots.slice(0, mineCount).forEach(([r, c]) => {
      board[r][c].mine = true;
    });
    mqCountBoard(board);
    if (mqIsNoGuess(board, safeRow, safeCol, mineCount)) return board;
  }
}
function mqReveal(board, row, col) {
  const next = board.map((line) => line.slice());
  const queue = [[row, col]];
  let count = 0;
  while (queue.length) {
    const [r, c] = queue.shift();
    const cell = next[r][c];
    if (cell.revealed || cell.flagged || cell.mine) continue;
    next[r][c] = { ...cell, revealed: true };
    count += 1;
    if (cell.adjacent === 0) {
      mqNeighbors(next.length, r, c).forEach(([nr, nc]) => {
        if (!next[nr][nc].revealed && !next[nr][nc].flagged && !next[nr][nc].mine) queue.push([nr, nc]);
      });
    }
  }
  return { board: next, count };
}
function mqWon(board) {
  return board.every((row) => row.every((cell) => cell.mine || cell.revealed));
}
function mqLoadProfile() {
  try {
    return { wins: 0, completed: 0, theme: "classic", achievements: {}, longestLogicStreak: 0, ...JSON.parse(localStorage.getItem(MQ_PROFILE_KEY) || "{}") };
  } catch (_) {
    return { wins: 0, completed: 0, theme: "classic", achievements: {}, longestLogicStreak: 0 };
  }
}
const MQCell = React.memo(({ cell, theme, disabled, highlighted, exploded, onOpen, onFlag }) => {
  let content = "";
  if (cell.flagged && !cell.revealed) content = theme.flag;
  else if (cell.revealed && cell.mine) content = theme.hazard;
  else if (cell.revealed && cell.adjacent) content = cell.adjacent;
  const numberColors = ["#fff", "#60a5fa", "#4ade80", "#fb7185", "#c084fc", "#f97316", "#22d3ee", "#f8fafc", "#94a3b8"];
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      className: `mq-cell ${cell.revealed ? "revealed" : ""} ${cell.flagged ? "flagged" : ""} ${cell.revealed && cell.mine ? "mine" : ""} ${highlighted ? "radar" : ""}`,
      style: { color: cell.revealed && !cell.mine ? numberColors[cell.adjacent] : void 0 },
      disabled: disabled || cell.revealed && cell.adjacent === 0,
      onClick: () => onOpen(cell.row, cell.col),
      onContextMenu: (event) => {
        event.preventDefault();
        onFlag(cell.row, cell.col);
      },
      "aria-label": `Row ${cell.row + 1}, column ${cell.col + 1}${cell.revealed ? cell.mine ? ", hazard" : `, ${cell.adjacent} nearby` : cell.flagged ? ", marked" : ", hidden"}`
    },
    /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, content)
  );
});
function MineQuestGame() {
  const [showHelp, setShowHelp] = React.useState(false);
  const helpTrigger = React.useRef(null);
  const [muted, setMuted] = React.useState(false);
  const mutedRef = React.useRef(false);
  const [mode, setMode] = React.useState("classic");
  const [difficulty, setDifficulty] = React.useState("classic");
  const [mission, setMission] = React.useState(0);
  const [profile, setProfile] = React.useState(mqLoadProfile);
  const [themeId, setThemeId] = React.useState(() => mqLoadProfile().theme || "classic");
  const config = mode === "classic" ? MQ_DIFFICULTIES[difficulty] : MQ_MISSIONS[mission];
  const [board, setBoard] = React.useState(() => mqEmptyBoard(9));
  const [placed, setPlaced] = React.useState(false);
  const [state, setState] = React.useState("playing");
  const [flagMode, setFlagMode] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [combo, setCombo] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [energy, setEnergy] = React.useState(16);
  const [shield, setShield] = React.useState(false);
  const [activeMines, setActiveMines] = React.useState(10);
  const [radarCells, setRadarCells] = React.useState(/* @__PURE__ */ new Set());
  const [message, setMessage] = React.useState("Every board can be solved without guessing.");
  const [medal, setMedal] = React.useState("");
  const [particles, setParticles] = React.useState([]);
  const [shaking, setShaking] = React.useState(false);
  const [everFlagged, setEverFlagged] = React.useState(false);
  const [powersUsed, setPowersUsed] = React.useState(false);
  const startRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const boardRef = React.useRef(board);
  const stateRef = React.useRef(state);
  const placedRef = React.useRef(placed);
  const shieldRef = React.useRef(shield);
  const energyRef = React.useRef(energy);
  const everFlaggedRef = React.useRef(false);
  const powersUsedRef = React.useRef(false);
  const comboRef = React.useRef(0);
  const theme = MQ_THEMES[themeId] || MQ_THEMES.classic;
  const saveProfile = React.useCallback((next) => {
    setProfile(next);
    try {
      localStorage.setItem(MQ_PROFILE_KEY, JSON.stringify(next));
    } catch (_) {
    }
  }, []);
  const commitBoard = React.useCallback((next) => {
    boardRef.current = next;
    setBoard(next);
  }, []);
  const tone = React.useCallback((frequency, duration = 0.06, volume = 0.025) => {
    if (mutedRef.current || document.hidden) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioRef.current) audioRef.current = new AudioContext();
    const ctx = audioRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, []);
  const burst = React.useCallback((count = 12) => {
    const next = Array.from({ length: count }, (_, id) => ({
      id: `${Date.now()}-${id}`,
      x: 45 + Math.random() * 10,
      y: 42 + Math.random() * 10,
      dx: `${(Math.random() - 0.5) * 260}px`,
      dy: `${(Math.random() - 0.5) * 260}px`
    }));
    setParticles(next);
    window.setTimeout(() => setParticles([]), 850);
  }, []);
  const stopTimer = React.useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);
  const startTimer = React.useCallback(() => {
    if (timerRef.current) return;
    startRef.current = Date.now();
    timerRef.current = window.setInterval(() => setTime(Math.floor((Date.now() - startRef.current) / 1e3)), 500);
  }, []);
  const reset = React.useCallback(() => {
    stopTimer();
    const current = mode === "classic" ? MQ_DIFFICULTIES[difficulty] : MQ_MISSIONS[mission];
    const fresh = mqEmptyBoard(current.size);
    commitBoard(fresh);
    setPlaced(false);
    placedRef.current = false;
    setState("playing");
    stateRef.current = "playing";
    setFlagMode(false);
    setTime(0);
    setCombo(0);
    setScore(0);
    setEnergy(mode === "adventure" ? 16 : 0);
    energyRef.current = mode === "adventure" ? 16 : 0;
    setShield(false);
    shieldRef.current = false;
    setActiveMines(current.mines);
    setRadarCells(/* @__PURE__ */ new Set());
    setMedal("");
    setMessage(mode === "adventure" ? current.story : "Every board can be solved without guessing.");
    setShaking(false);
    startRef.current = null;
    setEverFlagged(false);
    everFlaggedRef.current = false;
    setPowersUsed(false);
    powersUsedRef.current = false;
    comboRef.current = 0;
  }, [mode, difficulty, mission, commitBoard, stopTimer]);
  React.useEffect(() => {
    reset();
  }, [mode, difficulty, mission]);
  React.useEffect(() => () => stopTimer(), [stopTimer]);
  const finishWin = React.useCallback((wonBoard) => {
    stopTimer();
    const finalTime = startRef.current ? Math.floor((Date.now() - startRef.current) / 1e3) : time;
    setTime(finalTime);
    setState("won");
    stateRef.current = "won";
    const thresholds = config.medals;
    const award = finalTime <= thresholds[0] ? "gold" : finalTime <= thresholds[1] ? "silver" : "bronze";
    setMedal(award);
    tone(880, 0.25, 0.055);
    burst(28);
    if (navigator.vibrate) navigator.vibrate([35, 30, 70]);
    const bestKey2 = `familyPortalMineQuestBest:${mode}:${mode === "classic" ? difficulty : mission}`;
    try {
      const previousBest = Number(localStorage.getItem(bestKey2) || 0);
      if (!previousBest || finalTime < previousBest) localStorage.setItem(bestKey2, String(finalTime));
    } catch (_) {
    }
    const nextProfile = {
      ...profile,
      wins: profile.wins + 1,
      completed: mode === "adventure" ? Math.max(profile.completed, mission + 1) : profile.completed,
      theme: themeId,
      longestLogicStreak: Math.max(profile.longestLogicStreak || 0, comboRef.current),
      achievements: {
        ...profile.achievements || {},
        noFlags: (profile.achievements || {}).noFlags || !everFlaggedRef.current,
        noPowers: (profile.achievements || {}).noPowers || !powersUsedRef.current,
        perfectMarking: (profile.achievements || {}).perfectMarking || wonBoard.flat().filter((cell) => cell.flagged).length === activeMines && wonBoard.flat().every((cell) => !cell.flagged || cell.mine),
        logicStreak: (profile.achievements || {}).logicStreak || comboRef.current >= 10
      }
    };
    saveProfile(nextProfile);
    commitBoard(wonBoard.map((row) => row.map((cell) => cell.mine ? { ...cell, flagged: true } : cell)));
  }, [stopTimer, time, config, tone, burst, mode, difficulty, mission, profile, themeId, saveProfile, commitBoard]);
  const openCell = React.useCallback((row, col) => {
    if (stateRef.current !== "playing") return;
    if (flagMode) {
      const next = boardRef.current.map((line) => line.slice());
      const cell = next[row][col];
      if (!cell.revealed) {
        next[row][col] = { ...cell, flagged: !cell.flagged };
        setEverFlagged(true);
        everFlaggedRef.current = true;
      }
      commitBoard(next);
      tone(cell.flagged ? 230 : 320);
      return;
    }
    let working = boardRef.current;
    if (!placedRef.current) {
      setMessage("Building a guaranteed logic-only field…");
      working = mqGenerateNoGuess(config.size, config.mines, row, col);
      placedRef.current = true;
      setPlaced(true);
      commitBoard(working);
      startTimer();
    }
    const target = working[row][col];
    if (target.flagged) return;
    if (target.revealed) {
      if (target.adjacent <= 0) return;
      const neighbors = mqNeighbors(working.length, row, col);
      const marked = neighbors.filter(([nr, nc]) => working[nr][nc].flagged).length;
      if (marked !== target.adjacent) {
        setMessage(`Chord needs ${target.adjacent} matching mark${target.adjacent === 1 ? "" : "s"}; this number has ${marked}.`);
        tone(150, 0.09);
        return;
      }
      const hidden = neighbors.filter(([nr, nc]) => !working[nr][nc].revealed && !working[nr][nc].flagged);
      if (hidden.some(([nr, nc]) => working[nr][nc].mine)) {
        const lost = working.map((line) => line.map((cell) => cell.mine ? { ...cell, revealed: true } : cell));
        commitBoard(lost);
        setState("lost");
        stateRef.current = "lost";
        stopTimer();
        setCombo(0);
        comboRef.current = 0;
        setMessage("Chord hit a hazard: one neighboring mark was wrong.");
        setShaking(true);
        tone(75, 0.35, 0.07);
        burst(22);
        window.setTimeout(() => setShaking(false), 450);
        return;
      }
      let chordBoard = working;
      let opened = 0;
      hidden.forEach(([nr, nc]) => {
        const result2 = mqReveal(chordBoard, nr, nc);
        chordBoard = result2.board;
        opened += result2.count;
      });
      commitBoard(chordBoard);
      const chordCombo = comboRef.current + 1;
      comboRef.current = chordCombo;
      setCombo(chordCombo);
      setScore((value) => value + opened * 125 * (1 + Math.floor(chordCombo / 4)));
      setMessage(`Chord cascade opened ${opened} safe tile${opened === 1 ? "" : "s"}!`);
      tone(690, 0.12);
      if (opened >= 4) burst(Math.min(18, opened));
      if (mqWon(chordBoard)) finishWin(chordBoard);
      return;
    }
    if (target.mine) {
      if (shieldRef.current) {
        const protectedBoard = working.map((line) => line.slice());
        protectedBoard[row][col] = { ...target, flagged: true };
        commitBoard(protectedBoard);
        setShield(false);
        shieldRef.current = false;
        setCombo(0);
        comboRef.current = 0;
        setMessage("Shield saved the run! Hazard marked.");
        tone(180, 0.2, 0.045);
        burst(10);
        if (navigator.vibrate) navigator.vibrate(45);
        return;
      }
      const lost = working.map((line) => line.map((cell) => cell.mine ? { ...cell, revealed: true } : cell));
      commitBoard(lost);
      setState("lost");
      stateRef.current = "lost";
      stopTimer();
      setCombo(0);
      comboRef.current = 0;
      setMessage("Boom! The field has been reset for another try.");
      setShaking(true);
      tone(75, 0.35, 0.07);
      burst(22);
      if (navigator.vibrate) navigator.vibrate([90, 40, 120]);
      window.setTimeout(() => setShaking(false), 450);
      return;
    }
    const result = mqReveal(working, row, col);
    commitBoard(result.board);
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    comboRef.current = nextCombo;
    const multiplier = 1 + Math.floor(nextCombo / 4);
    setScore((value) => value + result.count * 100 * multiplier);
    if (mode === "adventure") {
      const gained = Math.max(1, Math.ceil(result.count / 2));
      energyRef.current += gained;
      setEnergy(energyRef.current);
    }
    setMessage(result.count >= 8 ? `Cascade! ${result.count} safe tiles · x${multiplier} score` : `Logic streak ${nextCombo}`);
    tone(260 + Math.min(nextCombo, 12) * 28 + Math.min(result.count, 10) * 14, 0.065, 0.025);
    if (result.count >= 5) burst(Math.min(18, result.count));
    if (navigator.vibrate && result.count >= 4) navigator.vibrate(18);
    if (mqWon(result.board)) finishWin(result.board);
  }, [flagMode, commitBoard, tone, config, startTimer, stopTimer, burst, combo, mode, finishWin]);
  const flagCell = React.useCallback((row, col) => {
    if (stateRef.current !== "playing") return;
    const next = boardRef.current.map((line) => line.slice());
    const cell = next[row][col];
    if (cell.revealed) return;
    next[row][col] = { ...cell, flagged: !cell.flagged };
    setEverFlagged(true);
    everFlaggedRef.current = true;
    commitBoard(next);
    tone(cell.flagged ? 220 : 330);
  }, [commitBoard, tone]);
  const spend = React.useCallback((cost) => {
    if (energyRef.current < cost) {
      setMessage(`Need ${cost - energyRef.current} more energy`);
      tone(110, 0.12);
      return false;
    }
    energyRef.current -= cost;
    setEnergy(energyRef.current);
    return true;
  }, [tone]);
  const scanner = React.useCallback(() => {
    if (!placedRef.current) {
      setMessage("Open one tile before using the scanner.");
      return;
    }
    if (!spend(12)) return;
    setPowersUsed(true);
    powersUsedRef.current = true;
    const safe = boardRef.current.flat().filter((cell2) => !cell2.mine && !cell2.revealed && !cell2.flagged);
    if (!safe.length) return;
    const cell = safe[Math.floor(Math.random() * safe.length)];
    const result = mqReveal(boardRef.current, cell.row, cell.col);
    commitBoard(result.board);
    setMessage(`Scanner found ${result.count} safe tile${result.count === 1 ? "" : "s"}.`);
    tone(620, 0.14);
    burst(8);
    if (mqWon(result.board)) finishWin(result.board);
  }, [spend, commitBoard, tone, burst, finishWin]);
  const armShield = React.useCallback(() => {
    if (shieldRef.current) {
      setMessage("Shield is already armed.");
      return;
    }
    if (!spend(16)) return;
    setPowersUsed(true);
    powersUsedRef.current = true;
    shieldRef.current = true;
    setShield(true);
    setMessage("Shield armed: one hazard hit is protected.");
    tone(520, 0.18);
    burst(8);
  }, [spend, tone, burst]);
  const radar = React.useCallback(() => {
    if (!placedRef.current) {
      setMessage("Open one tile before using radar.");
      return;
    }
    if (!spend(10)) return;
    setPowersUsed(true);
    powersUsedRef.current = true;
    const size = boardRef.current.length;
    const centerR = 1 + Math.floor(Math.random() * Math.max(1, size - 2));
    const centerC = 1 + Math.floor(Math.random() * Math.max(1, size - 2));
    const cells = /* @__PURE__ */ new Set();
    let hazards = 0;
    for (let r = centerR - 1; r <= centerR + 1; r += 1) for (let c = centerC - 1; c <= centerC + 1; c += 1) {
      cells.add(mqKey(r, c));
      if (boardRef.current[r][c].mine) hazards += 1;
    }
    setRadarCells(cells);
    setMessage(`Radar zone contains ${hazards} hazard${hazards === 1 ? "" : "s"}.`);
    tone(440, 0.2);
    window.setTimeout(() => setRadarCells(/* @__PURE__ */ new Set()), 3200);
  }, [spend, tone]);
  const defuse = React.useCallback(() => {
    if (!placedRef.current) {
      setMessage("Open one tile before using the defuser.");
      return;
    }
    if (!spend(22)) return;
    setPowersUsed(true);
    powersUsedRef.current = true;
    const hazards = boardRef.current.flat().filter((cell) => cell.mine && !cell.revealed && !cell.flagged);
    if (!hazards.length) {
      setMessage("No unmarked hazard is available.");
      return;
    }
    const target = hazards[Math.floor(Math.random() * hazards.length)];
    const next = boardRef.current.map((row) => row.map((cell) => ({ ...cell })));
    next[target.row][target.col].mine = false;
    next[target.row][target.col].flagged = false;
    mqCountBoard(next);
    commitBoard(next);
    setActiveMines((value) => value - 1);
    setMessage("Defuser removed one hidden hazard.");
    tone(760, 0.22);
    burst(14);
    if (mqWon(next)) finishWin(next);
  }, [spend, commitBoard, tone, burst, finishWin]);
  const chooseTheme = React.useCallback((id) => {
    if (profile.wins < MQ_THEMES[id].unlock) return;
    setThemeId(id);
    saveProfile({ ...profile, theme: id });
    tone(480, 0.1);
  }, [profile, saveProfile, tone]);
  const flags = board.flat().filter((cell) => cell.flagged).length;
  const bestKey = `familyPortalMineQuestBest:${mode}:${mode === "classic" ? difficulty : mission}`;
  let best = 0;
  try {
    best = Number(localStorage.getItem(bestKey) || 0);
  } catch (_) {
  }
  const medalIcon = medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉";
  return /* @__PURE__ */ React.createElement("div", { className: `minequest-shell theme-${themeId} ${shaking ? "mq-shake" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "mq-particles", "aria-hidden": "true" }, particles.map((particle) => /* @__PURE__ */ React.createElement("i", { key: particle.id, className: "mq-particle", style: { "--px": `${particle.x}%`, "--py": `${particle.y}%`, "--dx": particle.dx, "--dy": particle.dy } }))), /* @__PURE__ */ React.createElement("div", { className: "mini-layout mq-wrap" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls mq-controls" }, /* @__PURE__ */ React.createElement("div", { className: "mq-heading" }, /* @__PURE__ */ React.createElement("h1", { className: "mq-title" }, "MINESWEEPER"), /* @__PURE__ */ React.createElement("div", { className: "mq-tools mq-tabs" }, /* @__PURE__ */ React.createElement("button", { ref: helpTrigger, className: "mq-button", onClick: () => setShowHelp(true), "aria-label": "How to Play" }, /* @__PURE__ */ React.createElement("span", { className: "mq-tool-label" }, "How to Play"), /* @__PURE__ */ React.createElement("span", { className: "mq-tool-icon", "aria-hidden": "true" }, "?")), /* @__PURE__ */ React.createElement("button", { className: "mq-button", onClick: () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, "aria-label": muted ? "Unmute sounds" : "Mute sounds" }, /* @__PURE__ */ React.createElement("span", { className: "mq-tool-label" }, muted ? "Sound off" : "Sound on"), /* @__PURE__ */ React.createElement("span", { className: "mq-tool-icon", "aria-hidden": "true" }, muted ? "×" : "♪")))), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHelp, onClose: () => setShowHelp(false), triggerRef: helpTrigger }), /* @__PURE__ */ React.createElement("p", { className: "mq-subtitle" }, "MineQuest modes · Logic-only fields · Every board has a fair solution."), /* @__PURE__ */ React.createElement("details", { className: "mq-settings", open: window.matchMedia("(min-width: 701px) and (orientation: landscape)").matches }, /* @__PURE__ */ React.createElement("summary", null, "Game options"), /* @__PURE__ */ React.createElement("div", { className: "mq-tabs", "aria-label": "Game mode" }, /* @__PURE__ */ React.createElement("button", { className: `mq-button ${mode === "classic" ? "active" : ""}`, onClick: () => setMode("classic") }, "CLASSIC"), /* @__PURE__ */ React.createElement("button", { className: `mq-button ${mode === "adventure" ? "active" : ""}`, onClick: () => setMode("adventure") }, "ADVENTURE")), mode === "classic" ? /* @__PURE__ */ React.createElement("div", { className: "mq-difficulties", "aria-label": "Difficulty" }, Object.entries(MQ_DIFFICULTIES).map(([id, item]) => /* @__PURE__ */ React.createElement("button", { key: id, className: `mq-button ${difficulty === id ? "active" : ""}`, onClick: () => setDifficulty(id) }, item.label.toUpperCase(), " · ", item.size, "×", item.size))) : /* @__PURE__ */ React.createElement("div", { className: "mq-mission-strip", "aria-label": "Adventure missions" }, MQ_MISSIONS.map((item, index) => {
    const locked = index > profile.completed;
    return /* @__PURE__ */ React.createElement("button", { key: item.name, disabled: locked, className: `mq-button mq-mission ${mission === index ? "active" : ""}`, onClick: () => setMission(index) }, locked ? "🔒 " : "", index + 1, ". ", item.name, /* @__PURE__ */ React.createElement("small", null, item.story));
  })), /* @__PURE__ */ React.createElement("div", { className: "mq-themes", "aria-label": "Board theme" }, Object.entries(MQ_THEMES).map(([id, item]) => {
    const locked = profile.wins < item.unlock;
    return /* @__PURE__ */ React.createElement("button", { key: id, disabled: locked, title: locked ? `Unlock after ${item.unlock} wins` : item.label, "aria-label": locked ? `${item.label}, locked until ${item.unlock} wins` : item.label, className: `mq-button mq-theme ${themeId === id ? "active" : ""}`, onClick: () => chooseTheme(id) }, locked ? "🔒" : item.icon);
  }))), /* @__PURE__ */ React.createElement("div", { className: "mq-status" }, /* @__PURE__ */ React.createElement("div", { className: "mq-stat" }, /* @__PURE__ */ React.createElement("small", null, "HAZARDS"), /* @__PURE__ */ React.createElement("strong", null, String(activeMines - flags).padStart(2, "0"))), /* @__PURE__ */ React.createElement("div", { className: "mq-stat" }, /* @__PURE__ */ React.createElement("small", null, "TIME"), /* @__PURE__ */ React.createElement("strong", null, String(time).padStart(3, "0"))), /* @__PURE__ */ React.createElement("button", { className: "mq-button mq-face", onClick: reset, "aria-label": "Start a new board" }, state === "won" ? "😎" : state === "lost" ? "😵" : "🙂"), /* @__PURE__ */ React.createElement("div", { className: `mq-stat ${combo ? "mq-combo" : ""}`, key: combo }, /* @__PURE__ */ React.createElement("small", null, "STREAK"), /* @__PURE__ */ React.createElement("strong", null, "×", combo)), /* @__PURE__ */ React.createElement("div", { className: "mq-stat" }, /* @__PURE__ */ React.createElement("small", null, "SCORE"), /* @__PURE__ */ React.createElement("strong", null, score))), /* @__PURE__ */ React.createElement("div", { className: "mq-mark-mode mq-tabs" }, /* @__PURE__ */ React.createElement("button", { className: `mq-button ${flagMode ? "active" : ""}`, onClick: () => setFlagMode(!flagMode), "aria-pressed": flagMode }, theme.flag, " MARK MODE ", flagMode ? "ON" : "OFF")), mode === "adventure" && /* @__PURE__ */ React.createElement("div", { className: "mq-powers", "aria-label": `Power-ups, ${energy} energy available` }, /* @__PURE__ */ React.createElement("button", { className: "mq-button mq-power", disabled: state !== "playing", onClick: scanner }, /* @__PURE__ */ React.createElement("span", null, "🔎"), "SCANNER", /* @__PURE__ */ React.createElement("small", null, "12 ENERGY")), /* @__PURE__ */ React.createElement("button", { className: `mq-button mq-power ${shield ? "armed" : ""}`, disabled: state !== "playing", onClick: armShield }, /* @__PURE__ */ React.createElement("span", null, "🛡️"), "SHIELD", /* @__PURE__ */ React.createElement("small", null, shield ? "ARMED" : "16 ENERGY")), /* @__PURE__ */ React.createElement("button", { className: "mq-button mq-power", disabled: state !== "playing", onClick: radar }, /* @__PURE__ */ React.createElement("span", null, "📡"), "RADAR", /* @__PURE__ */ React.createElement("small", null, "10 ENERGY")), /* @__PURE__ */ React.createElement("button", { className: "mq-button mq-power", disabled: state !== "playing", onClick: defuse }, /* @__PURE__ */ React.createElement("span", null, "🧰"), "DEFUSER", /* @__PURE__ */ React.createElement("small", null, "22 ENERGY")), /* @__PURE__ */ React.createElement("div", { className: "mq-stat" }, /* @__PURE__ */ React.createElement("small", null, "ENERGY"), /* @__PURE__ */ React.createElement("strong", null, "⚡", energy))), /* @__PURE__ */ React.createElement("div", { className: "mq-objective" }, mode === "adventure" ? `Mission ${mission + 1}: ${config.story}` : `${config.label} field · ${config.mines} hazards`, " · Best ", best ? `${best}s` : "—"), /* @__PURE__ */ React.createElement("div", { className: "mq-progress" }, "Tap a revealed number to chord when its neighboring marks match."), /* @__PURE__ */ React.createElement("div", { className: "mq-message", role: "status", "aria-live": "polite" }, message)), /* @__PURE__ */ React.createElement("main", { className: "mini-board mq-board-frame" }, /* @__PURE__ */ React.createElement("div", { className: "mq-board", style: { "--grid-size": config.size }, role: "grid", "aria-label": `${config.size} by ${config.size} MineQuest field` }, board.map((row) => row.map((cell) => /* @__PURE__ */ React.createElement(MQCell, { key: mqKey(cell.row, cell.col), cell, theme, disabled: state !== "playing", highlighted: radarCells.has(mqKey(cell.row, cell.col)), onOpen: openCell, onFlag: flagCell })))), state !== "playing" && /* @__PURE__ */ React.createElement("div", { className: "mq-overlay", role: "alert" }, state === "won" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mq-medal" }, medalIcon), /* @__PURE__ */ React.createElement("h2", null, medal.toUpperCase(), " CLEAR!"), /* @__PURE__ */ React.createElement("p", null, time, "s · ", score, " points · logic streak ×", combo), mode === "adventure" && mission + 1 < MQ_MISSIONS.length && /* @__PURE__ */ React.createElement("p", null, "Next mission unlocked!")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "mq-medal" }, "💥"), /* @__PURE__ */ React.createElement("h2", null, "FIELD TRIPPED"), /* @__PURE__ */ React.createElement("p", null, "Your next board will be fair and ready.")), /* @__PURE__ */ React.createElement("button", { className: "mq-button active", onClick: reset }, "PLAY AGAIN"))), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("details", { className: "mq-records" }, /* @__PURE__ */ React.createElement("summary", null, "Family records"), "        ", /* @__PURE__ */ React.createElement("div", { className: "mq-tabs", "aria-label": "Tactical achievements" }, [
    ["noFlags", "🚩", "No Flags"],
    ["noPowers", "⚡", "No Powers"],
    ["perfectMarking", "🎯", "Perfect Marking"],
    ["logicStreak", "🧠", "10 Logic Streak"]
  ].map(([id, icon, label]) => /* @__PURE__ */ React.createElement("span", { key: id, className: `mq-button ${(profile.achievements || {})[id] ? "active" : ""}`, title: (profile.achievements || {})[id] ? "Unlocked" : "Not unlocked yet" }, (profile.achievements || {})[id] ? icon : "🔒", " ", label)), /* @__PURE__ */ React.createElement("span", { className: "mq-button" }, "Best streak ×", profile.longestLogicStreak || 0)), /* @__PURE__ */ React.createElement("p", { className: "mq-progress" }, profile.wins, " total win", profile.wins === 1 ? "" : "s", " · Themes unlock at 1, 3, and 6 wins · Adventure powers recharge by clearing safe tiles.")))));
}
ReactDOM.render(/* @__PURE__ */ React.createElement(MineQuestGame, null), document.getElementById("root"));
(() => {
  let queued = false, layout, board, observer;
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(fit);
    }
  };
  function fit() {
    queued = false;
    if (!layout || !board || !layout.isConnected || document.hidden) return;
    const shell = layout.closest(".mini-shell,.minequest-shell");
    const cs = getComputedStyle(layout), ss = getComputedStyle(shell || layout);
    const number = (value) => parseFloat(value) || 0;
    const vertical = cs.display === "flex";
    const controls = layout.querySelector(":scope > .mini-controls");
    const bottom = layout.querySelector(":scope > .mini-bottom");
    const r = board.getBoundingClientRect();
    let ratio = 1;
    if (board.style.getPropertyValue("--peg-cols")) ratio = number(board.style.getPropertyValue("--peg-cols")) / number(board.style.getPropertyValue("--peg-rows"));
    else if (board.style.getPropertyValue("--memory-cols")) ratio = number(board.style.getPropertyValue("--memory-cols")) / number(board.style.getPropertyValue("--memory-rows"));
    else {
      const grid = board.querySelector('[role="grid"]');
      if (grid) {
        const ar = getComputedStyle(grid).aspectRatio.split("/").map(Number);
        if (ar.length === 2 && ar[0] > 0 && ar[1] > 0) ratio = ar[0] / ar[1];
      }
    }
    const overhead = Math.max(0, r.height - r.width / ratio);
    let available = innerHeight - number(ss.paddingTop) - number(ss.paddingBottom) - number(cs.paddingTop) - number(cs.paddingBottom);
    let width;
    if (vertical) {
      available -= (controls?.getBoundingClientRect().height || 0) + (bottom?.getBoundingClientRect().height || 0) + number(cs.rowGap) * 2;
      width = layout.clientWidth - number(cs.paddingLeft) - number(cs.paddingRight);
    } else {
      width = number(cs.gridTemplateColumns.split(" ")[1]);
    }
    const next = Math.max(100, Math.min(width || r.width, (available - overhead) * ratio));
    if (Math.abs(r.width - next) > 1) board.style.setProperty("width", next + "px", "important");
  }
  function connect() {
    const next = document.querySelector(".mini-layout");
    const nextBoard = next?.querySelector(":scope > .mini-board");
    if (next === layout && nextBoard === board) return;
    observer?.disconnect();
    layout = next;
    board = nextBoard;
    if (!layout || !board) return;
    observer = new ResizeObserver(schedule);
    observer.observe(layout);
    observer.observe(board);
    for (const el of layout.querySelectorAll(":scope > .mini-controls,:scope > .mini-bottom")) observer.observe(el);
    schedule();
  }
  new MutationObserver(connect).observe(document.getElementById("root"), { childList: true, subtree: true });
  addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", schedule);
  document.fonts?.ready.then(schedule);
  connect();
})();
