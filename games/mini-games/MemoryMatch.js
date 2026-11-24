// Generated from MemoryMatch.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const ANIMALS = [
  { emoji: "🐶", name: "Dog" },
  { emoji: "🐱", name: "Cat" },
  { emoji: "🐭", name: "Mouse" },
  { emoji: "🐹", name: "Hamster" },
  { emoji: "🦊", name: "Fox" },
  { emoji: "🐻", name: "Bear" },
  { emoji: "🐼", name: "Panda" },
  { emoji: "🐨", name: "Koala" },
  { emoji: "🦁", name: "Lion" },
  { emoji: "🐸", name: "Frog" },
  { emoji: "🐙", name: "Octopus" },
  { emoji: "🦋", name: "Butterfly" },
  { emoji: "🦉", name: "Owl" },
  { emoji: "🐢", name: "Turtle" },
  { emoji: "🐬", name: "Dolphin" },
  { emoji: "🦖", name: "Dinosaur" },
  { emoji: "🦄", name: "Unicorn" },
  { emoji: "🐧", name: "Penguin" }
];
const BEST_MOVES_KEY = "familyPortalMemoryMatchBestMoves";
const MISMATCH_DELAY_MS = 800;
const MATCH_RESOLVE_MS = 450;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const createShuffledDeck = (pairCount = 8) => {
  const chosen = ANIMALS.slice(0, pairCount);
  const pairs = [...chosen, ...chosen];
  return shuffle(pairs).map((animal, index) => ({
    id: index,
    emoji: animal.emoji,
    name: animal.name
  }));
};
const chunkIntoRows = (arr, size) => {
  const rows = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
};
const HowToPlayModal = ({ isOpen, onClose, triggerRef }) => {
  const closeButtonRef = React.useRef(null);
  const modalRef = React.useRef(null);
  React.useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);
  const handleClose = React.useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    });
  }, [onClose, triggerRef]);
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);
  if (!isOpen) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      onClick: handleClose,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "how-to-play-title",
      ref: modalRef
    },
    /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", "aria-hidden": "true" }),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "relative bg-gray-900 border border-rose-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-rose-500/20 animate-fade-in",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          ref: closeButtonRef,
          onClick: handleClose,
          className: "absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-300 hover:text-white transition-colors text-2xl leading-none rounded-lg",
          "aria-label": "Close instructions"
        },
        "×"
      ),
      /* @__PURE__ */ React.createElement("h2", { id: "how-to-play-title", className: "text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-4" }, "How to Play"),
      /* @__PURE__ */ React.createElement("ul", { className: "text-rose-100/90 text-sm space-y-3 list-none" }, /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Tap any ", /* @__PURE__ */ React.createElement("strong", { className: "text-rose-300" }, "face-down card"), " to flip it over and reveal the animal underneath.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Flip ", /* @__PURE__ */ React.createElement("strong", { className: "text-rose-300" }, "two cards"), " to check for a match. Matching pairs stay face-up!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "If they don't match, they'll ", /* @__PURE__ */ React.createElement("strong", { className: "text-rose-300" }, "flip back"), " after a moment — remember where they were!")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Find ", /* @__PURE__ */ React.createElement("strong", { className: "text-pink-300" }, "every pair"), ". Board sizes range from Junior to a 36-card Huge challenge.")), /* @__PURE__ */ React.createElement("li", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-rose-400 mt-0.5", "aria-hidden": "true" }, "▶"), /* @__PURE__ */ React.createElement("span", null, "Choose Zen, Timed, Combo, or mistake-limited play—or compete with two players for pairs and extra turns."))),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleClose,
          className: "mt-5 w-full py-2 min-h-[44px] rounded-lg font-bold text-black bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-300 hover:to-pink-400 transition-all"
        },
        "Got it!"
      )
    )
  );
};
const MemoryCard = React.memo(({ card, isFaceUp, isMatched, justMatched, onFlip, disabled, compact }) => {
  const handleClick = React.useCallback(() => {
    onFlip(card.id);
  }, [onFlip, card.id]);
  let label;
  if (isMatched) {
    label = `Card, matched pair, ${card.name}`;
  } else if (isFaceUp) {
    label = `Card, showing ${card.name}`;
  } else {
    label = "Card, face down, tap to flip";
  }
  return /* @__PURE__ */ React.createElement("div", { role: "gridcell" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleClick,
      disabled: disabled || isFaceUp || isMatched,
      "aria-pressed": isFaceUp || isMatched,
      "aria-label": label,
      className: `card-flip-outer ${compact ? "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" : "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"} rounded-xl disabled:cursor-default`
    },
    /* @__PURE__ */ React.createElement("div", { className: `card-flip-inner ${isFaceUp || isMatched ? "is-flipped" : ""} ${justMatched ? "card-pulse" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "card-face card-back", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl sm:text-3xl opacity-70" }, "🐾")), /* @__PURE__ */ React.createElement("div", { className: `card-face card-front ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"}`, "aria-hidden": "true" }, card.emoji))
  ));
});
const MemoryMatchGame = () => {
  const SIZE_OPTIONS = { junior: { label: "Junior", pairs: 3, cols: 3, time: 45 }, standard: { label: "Standard", pairs: 8, cols: 4, time: 90 }, expert: { label: "Expert", pairs: 12, cols: 6, time: 120 }, huge: { label: "Huge", pairs: 18, cols: 6, time: 180 } };
  const [sizeId, setSizeId] = React.useState("standard");
  const [playMode, setPlayMode] = React.useState("relaxed");
  const [twoPlayer, setTwoPlayer] = React.useState(false);
  const sizeConfig = SIZE_OPTIONS[sizeId];
  const [deck, setDeck] = React.useState(() => createShuffledDeck(8));
  const [selected, setSelected] = React.useState([]);
  const [matched, setMatched] = React.useState(() => /* @__PURE__ */ new Set());
  const [justMatchedIds, setJustMatchedIds] = React.useState(() => /* @__PURE__ */ new Set());
  const [moves, setMoves] = React.useState(0);
  const [bestMoves, setBestMoves] = React.useState(null);
  const [newBest, setNewBest] = React.useState(false);
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [currentPlayer, setCurrentPlayer] = React.useState(0);
  const [playerScores, setPlayerScores] = React.useState([0, 0]);
  const [combo, setCombo] = React.useState(0);
  const [points, setPoints] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(90);
  const [started, setStarted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const busyRef = React.useRef(false);
  const resolveTimeoutRef = React.useRef(null);
  const pulseTimeoutRef = React.useRef(null);
  const howToPlayTriggerRef = React.useRef(null);
  const newGameButtonRef = React.useRef(null);
  const prevIsWonRef = React.useRef(false);
  const matchedPairs = matched.size / 2;
  const totalPairs = sizeConfig.pairs;
  const isWon = matchedPairs === totalPairs;
  const gameEnded = isWon || failed;
  React.useEffect(() => {
    const stored = Number(localStorage.getItem(`${BEST_MOVES_KEY}:${sizeId}:${playMode}`));
    if (!Number.isNaN(stored) && stored > 0) setBestMoves(stored);
    else setBestMoves(null);
  }, [sizeId, playMode]);
  React.useEffect(() => {
    if (isWon && (bestMoves === null || moves < bestMoves)) {
      localStorage.setItem(`${BEST_MOVES_KEY}:${sizeId}:${playMode}`, String(moves));
      setBestMoves(moves);
      setNewBest(true);
    }
  }, [isWon, moves, bestMoves, sizeId, playMode]);
  React.useEffect(() => {
    if (playMode !== "timed" || !started || gameEnded) return;
    const timer = setInterval(() => setTimeLeft((value) => {
      if (value <= 1) {
        setFailed(true);
        return 0;
      }
      return value - 1;
    }), 1e3);
    return () => clearInterval(timer);
  }, [playMode, started, gameEnded]);
  React.useEffect(() => {
    if (isWon && !prevIsWonRef.current && newGameButtonRef.current) {
      newGameButtonRef.current.focus();
    }
    prevIsWonRef.current = isWon;
  }, [isWon]);
  React.useEffect(() => () => {
    if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
  }, []);
  const handleFlip = React.useCallback((id) => {
    if (busyRef.current || gameEnded) return;
    setStarted(true);
    if (matched.has(id)) return;
    if (selected.includes(id)) return;
    if (selected.length === 0) {
      setSelected([id]);
      return;
    }
    const pair = [selected[0], id];
    setSelected(pair);
    busyRef.current = true;
    setMoves((m) => m + 1);
    const firstCard = deck.find((c) => c.id === pair[0]);
    const secondCard = deck.find((c) => c.id === pair[1]);
    const isMatch = firstCard && secondCard && firstCard.emoji === secondCard.emoji;
    if (isMatch) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setPoints((value) => value + 100 * nextCombo);
      resolveTimeoutRef.current = setTimeout(() => {
        setMatched((prev) => {
          const next = new Set(prev);
          next.add(pair[0]);
          next.add(pair[1]);
          return next;
        });
        setJustMatchedIds(new Set(pair));
        setSelected([]);
        if (twoPlayer) setPlayerScores((scores) => scores.map((value, index) => index === currentPlayer ? value + 1 : value));
        busyRef.current = false;
        pulseTimeoutRef.current = setTimeout(() => {
          setJustMatchedIds(/* @__PURE__ */ new Set());
        }, MATCH_RESOLVE_MS);
      }, 150);
    } else {
      setCombo(0);
      setMistakes((value) => {
        const next = value + 1;
        if (playMode === "limited" && next >= 8) setFailed(true);
        return next;
      });
      resolveTimeoutRef.current = setTimeout(() => {
        setSelected([]);
        if (twoPlayer) setCurrentPlayer((player) => player === 0 ? 1 : 0);
        busyRef.current = false;
      }, MISMATCH_DELAY_MS);
    }
  }, [selected, matched, deck, combo, twoPlayer, currentPlayer, playMode, gameEnded]);
  const startNewGame = React.useCallback(() => {
    if (resolveTimeoutRef.current) clearTimeout(resolveTimeoutRef.current);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    busyRef.current = false;
    setDeck(createShuffledDeck(sizeConfig.pairs));
    setSelected([]);
    setMatched(/* @__PURE__ */ new Set());
    setJustMatchedIds(/* @__PURE__ */ new Set());
    setMoves(0);
    setCurrentPlayer(0);
    setPlayerScores([0, 0]);
    setCombo(0);
    setPoints(0);
    setMistakes(0);
    setTimeLeft(sizeConfig.time);
    setStarted(false);
    setFailed(false);
    setNewBest(false);
  }, [sizeConfig]);
  React.useEffect(() => {
    startNewGame();
  }, [sizeId, playMode, twoPlayer]);
  const openHowToPlay = React.useCallback(() => setShowHowToPlay(true), []);
  const closeHowToPlay = React.useCallback(() => setShowHowToPlay(false), []);
  const rows = React.useMemo(() => chunkIntoRows(deck, sizeConfig.cols), [deck, sizeConfig.cols]);
  return /* @__PURE__ */ React.createElement("div", { className: "mini-shell memory-shell min-h-screen bg-black text-white font-sans relative overflow-hidden p-4 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-gradient-to-br from-black via-rose-950/30 to-black", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full bg-repeat scanline-animation pointer-events-none", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "mini-layout relative z-10 w-full max-w-2xl mx-auto text-center" }, /* @__PURE__ */ React.createElement("aside", { className: "mini-controls" }, /* @__PURE__ */ React.createElement("header", { className: "game-header py-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl md:text-5xl font-black bg-gradient-to-r from-rose-300 via-pink-400 to-rose-400 bg-clip-text text-transparent tracking-wider text-shadow-neon" }, "MEMORY MATCH"), /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: howToPlayTriggerRef,
      onClick: openHowToPlay,
      className: "min-w-[44px] min-h-[44px] rounded-full border border-rose-400/50 bg-rose-400/10 text-rose-200 hover:bg-rose-400/30 hover:text-white transition-all flex items-center justify-center text-lg flex-shrink-0",
      "aria-label": "How to Play",
      title: "How to Play"
    },
    "❓"
  )), /* @__PURE__ */ React.createElement("p", { className: "text-rose-200/80 mt-2" }, "Flip cards and find all the pairs!")), /* @__PURE__ */ React.createElement(HowToPlayModal, { isOpen: showHowToPlay, onClose: closeHowToPlay, triggerRef: howToPlayTriggerRef }), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 overflow-x-auto mb-2 justify-start sm:justify-center" }, Object.entries(SIZE_OPTIONS).map(([id, item]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => setSizeId(id), className: `shrink-0 px-2 py-1 rounded border text-xs ${sizeId === id ? "bg-rose-500 text-black" : "bg-gray-900 border-rose-800"}` }, item.label, " · ", item.pairs, " pairs"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-1 mb-3" }, [["relaxed", "Zen"], ["timed", "Timed"], ["combo", "Combo"], ["limited", "8 Mistakes"]].map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => setPlayMode(id), className: `px-2 py-1 rounded border text-xs ${playMode === id ? "bg-purple-500 text-black" : "bg-gray-900 border-purple-800"}` }, label)), /* @__PURE__ */ React.createElement("button", { onClick: () => setTwoPlayer((value) => !value), className: `px-2 py-1 rounded border text-xs ${twoPlayer ? "bg-cyan-500 text-black" : "bg-gray-900 border-cyan-800"}` }, twoPlayer ? "2 Players" : "Solo")), twoPlayer && /* @__PURE__ */ React.createElement("div", { className: "mb-2 text-sm" }, /* @__PURE__ */ React.createElement("b", { className: currentPlayer === 0 ? "text-rose-300" : "text-gray-500" }, "Player 1: ", playerScores[0]), " · ", /* @__PURE__ */ React.createElement("b", { className: currentPlayer === 1 ? "text-cyan-300" : "text-gray-500" }, "Player 2: ", playerScores[1]), " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs" }, "(match = extra turn)")), /* @__PURE__ */ React.createElement("div", { className: "mb-2 flex justify-center gap-3 text-xs text-rose-100" }, playMode === "timed" && /* @__PURE__ */ React.createElement("span", null, "⏱ ", timeLeft, "s"), (playMode === "combo" || combo > 1) && /* @__PURE__ */ React.createElement("span", null, "🔥 Combo ×", combo, " · ", points, " pts"), playMode === "limited" && /* @__PURE__ */ React.createElement("span", null, "❌ ", mistakes, "/8 mistakes")), /* @__PURE__ */ React.createElement("div", { className: "game-stats flex items-center justify-center gap-3 mb-4", "aria-live": "polite", "aria-atomic": "true" }, /* @__PURE__ */ React.createElement("div", { className: "bg-black/40 border border-rose-400/30 rounded-xl px-5 py-2 min-w-[90px]" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-rose-300/70" }, "Moves"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-rose-100" }, moves)), /* @__PURE__ */ React.createElement("div", { className: "bg-black/40 border border-rose-400/30 rounded-xl px-5 py-2 min-w-[90px]" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-rose-300/70" }, "Pairs"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-rose-100" }, matchedPairs, "/", totalPairs)), /* @__PURE__ */ React.createElement("div", { className: "bg-black/40 border border-rose-400/30 rounded-xl px-5 py-2 min-w-[90px]" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-rose-300/70" }, "Best"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-rose-100" }, bestMoves === null ? "–" : bestMoves)))), /* @__PURE__ */ React.createElement("main", { style: { "--memory-cols": sizeConfig.cols, "--memory-rows": rows.length }, className: "mini-board game-board relative bg-black/30 rounded-2xl p-3 md:p-4 border border-rose-400/30 shadow-2xl shadow-rose-500/10" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "grid",
      "aria-label": `Memory match board, ${matchedPairs} of ${totalPairs} pairs matched`,
      className: "flex flex-col gap-2 sm:gap-3 items-center"
    },
    rows.map((row, r) => /* @__PURE__ */ React.createElement("div", { key: r, role: "row", className: "flex gap-2 sm:gap-3 justify-center" }, row.map((card) => /* @__PURE__ */ React.createElement(
      MemoryCard,
      {
        key: card.id,
        card,
        isFaceUp: selected.includes(card.id),
        isMatched: matched.has(card.id),
        justMatched: justMatchedIds.has(card.id),
        onFlip: handleFlip,
        disabled: showHowToPlay || gameEnded,
        compact: sizeConfig.cols >= 6
      }
    ))))
  ), gameEnded && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in",
      role: "alert"
    },
    /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black text-pink-300 text-shadow-neon" }, isWon ? "YOU WIN!" : "ROUND OVER"),
    /* @__PURE__ */ React.createElement("p", { className: "text-rose-100" }, isWon ? `You matched all ${totalPairs} pairs in ${moves} moves.` : playMode === "timed" ? "Time ran out." : "You used all 8 mistakes."),
    twoPlayer && /* @__PURE__ */ React.createElement("p", { className: "text-cyan-200 font-bold" }, playerScores[0] === playerScores[1] ? "Tie game!" : `${playerScores[0] > playerScores[1] ? "Player 1" : "Player 2"} wins ${Math.max(...playerScores)}–${Math.min(...playerScores)}!`),
    newBest && /* @__PURE__ */ React.createElement("p", { className: "text-yellow-200 text-sm font-bold" }, "New best score!"),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        ref: newGameButtonRef,
        onClick: startNewGame,
        className: "py-2 px-6 min-h-[44px] rounded-xl font-bold text-black bg-gradient-to-r from-rose-400 to-pink-500 hover:scale-105 transition-all"
      },
      "New Game"
    )
  )), /* @__PURE__ */ React.createElement("div", { className: "mini-bottom" }, /* @__PURE__ */ React.createElement("footer", { className: "game-footer py-6" }, !isWon && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: startNewGame,
      className: "mt-2 py-3 px-10 min-h-[44px] rounded-xl font-bold text-lg text-black transition-all duration-200 bg-gradient-to-r from-rose-400 to-pink-500 hover:scale-105 shadow-lg shadow-rose-500/40"
    },
    "New Game"
  )))));
};
ReactDOM.render(/* @__PURE__ */ React.createElement(MemoryMatchGame, null), document.getElementById("root"));
