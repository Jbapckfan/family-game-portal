// Generated from zoo-conquest.jsx by tools/build-react-games.mjs; do not edit.
"use strict";
const { useState, useEffect, useCallback } = React;
const CAN_HOVER = window.matchMedia("(hover: hover)").matches;
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const SoundSystem = /* @__PURE__ */ (() => {
  let ctx = null;
  let muted = false;
  const getCtx = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const playTone = (freq, duration, type = "square", volume = 0.12) => {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  };
  const playNoise = (duration, volume = 0.06) => {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(1e-3, ac.currentTime + duration);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  };
  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    setMuted(v) {
      muted = v;
    },
    diceRoll() {
      playNoise(0.15, 0.08);
      setTimeout(() => playTone(300, 0.08, "square", 0.08), 60);
      setTimeout(() => playTone(400, 0.08, "square", 0.08), 120);
    },
    conquest() {
      playTone(523, 0.12, "square", 0.1);
      setTimeout(() => playTone(659, 0.12, "square", 0.1), 120);
      setTimeout(() => playTone(784, 0.2, "square", 0.12), 240);
    },
    placeTroop() {
      playTone(660, 0.08, "sine", 0.07);
    },
    cardTrade() {
      playTone(440, 0.1, "triangle", 0.08);
      setTimeout(() => playTone(554, 0.1, "triangle", 0.08), 100);
      setTimeout(() => playTone(660, 0.15, "triangle", 0.1), 200);
    },
    gameOver() {
      const notes = [523, 494, 440, 392, 349];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, "sawtooth", 0.08), i * 200);
      });
    },
    victory() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.2, "square", 0.1), i * 150);
      });
    }
  };
})();
const ANIMAL_ARMIES = {
  turtles: { name: "Turtles", color: "#22c55e", emoji: "🐢", bgColor: "bg-green-500" },
  pandas: { name: "Pandas", color: "#6b7280", emoji: "🐼", bgColor: "bg-gray-800" },
  penguins: { name: "Penguins", color: "#3b82f6", emoji: "🐧", bgColor: "bg-blue-500" },
  stingrays: { name: "Stingrays", color: "#92400e", emoji: "🦈", bgColor: "bg-amber-700" },
  redPandas: { name: "Red Pandas", color: "#dc2626", emoji: "🦊", bgColor: "bg-red-600" },
  flamingos: { name: "Flamingos", color: "#ec4899", emoji: "🦩", bgColor: "bg-pink-500" }
};
const TERRITORIES = {
  // EAGLE RIDGE - 9 territories (+5 bonus) - Top left area
  alaska: { name: "Eagle's Peak", region: "NorthAmerica", x: 70, y: 70, connections: ["northwest", "alberta", "kamchatka"] },
  northwest: { name: "Wolf Den", region: "NorthAmerica", x: 130, y: 90, connections: ["alaska", "alberta", "ontario", "greenland"] },
  greenland: { name: "Polar Bear Cave", region: "NorthAmerica", x: 280, y: 50, connections: ["northwest", "ontario", "quebec", "iceland"] },
  alberta: { name: "Bison Plains", region: "NorthAmerica", x: 100, y: 140, connections: ["alaska", "northwest", "ontario", "westus"] },
  ontario: { name: "Moose Meadow", region: "NorthAmerica", x: 170, y: 150, connections: ["northwest", "alberta", "greenland", "quebec", "westus", "eastus"] },
  quebec: { name: "Beaver Lodge", region: "NorthAmerica", x: 230, y: 140, connections: ["ontario", "greenland", "eastus"] },
  westus: { name: "Coyote Canyon", region: "NorthAmerica", x: 90, y: 200, connections: ["alberta", "ontario", "eastus", "centralam"] },
  eastus: { name: "Deer Hollow", region: "NorthAmerica", x: 160, y: 210, connections: ["ontario", "quebec", "westus", "centralam"] },
  centralam: { name: "Jaguar Jungle", region: "NorthAmerica", x: 120, y: 270, connections: ["westus", "eastus", "venezuela"] },
  // PARROT PARADISE - 4 territories (+2 bonus) - Bottom left
  venezuela: { name: "Macaw Canopy", region: "SouthAmerica", x: 160, y: 330, connections: ["centralam", "peru", "brazil"] },
  peru: { name: "Llama Heights", region: "SouthAmerica", x: 150, y: 400, connections: ["venezuela", "brazil", "argentina"] },
  brazil: { name: "Toucan Forest", region: "SouthAmerica", x: 210, y: 380, connections: ["venezuela", "peru", "argentina", "northafrica"] },
  argentina: { name: "Penguin Shore", region: "SouthAmerica", x: 170, y: 480, connections: ["peru", "brazil"] },
  // DEER WOODS - 7 territories (+5 bonus) - Top center
  iceland: { name: "Puffin Cliffs", region: "Europe", x: 340, y: 70, connections: ["greenland", "scandinavia", "britain"] },
  scandinavia: { name: "Reindeer Tundra", region: "Europe", x: 420, y: 80, connections: ["iceland", "britain", "northeur", "ukraine"] },
  ukraine: { name: "Lynx Woods", region: "Europe", x: 490, y: 120, connections: ["scandinavia", "northeur", "southeur", "ural", "afghan", "mideast"] },
  britain: { name: "Fox Burrow", region: "Europe", x: 350, y: 140, connections: ["iceland", "scandinavia", "northeur", "westeur"] },
  northeur: { name: "Hedgehog Thicket", region: "Europe", x: 420, y: 150, connections: ["scandinavia", "ukraine", "britain", "westeur", "southeur"] },
  westeur: { name: "Stork Nest", region: "Europe", x: 360, y: 210, connections: ["britain", "northeur", "southeur", "northafrica"] },
  southeur: { name: "Ibex Ridge", region: "Europe", x: 430, y: 200, connections: ["northeur", "ukraine", "westeur", "northafrica", "egypt", "mideast"] },
  // LION SAVANNA - 6 territories (+3 bonus) - Bottom center
  northafrica: { name: "Camel Dunes", region: "Africa", x: 370, y: 300, connections: ["brazil", "westeur", "southeur", "egypt", "eastafrica", "congo"] },
  egypt: { name: "Cobra Oasis", region: "Africa", x: 440, y: 280, connections: ["southeur", "northafrica", "eastafrica", "mideast"] },
  eastafrica: { name: "Zebra Savanna", region: "Africa", x: 470, y: 350, connections: ["northafrica", "egypt", "congo", "southafrica", "madagascar", "mideast"] },
  congo: { name: "Gorilla Grove", region: "Africa", x: 410, y: 400, connections: ["northafrica", "eastafrica", "southafrica"] },
  southafrica: { name: "Rhino Plateau", region: "Africa", x: 430, y: 480, connections: ["congo", "eastafrica", "madagascar"] },
  madagascar: { name: "Lemur Island", region: "Africa", x: 500, y: 460, connections: ["eastafrica", "southafrica"] },
  // TIGER TERRITORY - 12 territories (+7 bonus) - Right side
  ural: { name: "Snow Leopard Pass", region: "Asia", x: 560, y: 100, connections: ["ukraine", "siberia", "afghan", "china"] },
  siberia: { name: "Tiger Trail", region: "Asia", x: 620, y: 70, connections: ["ural", "yakutsk", "irkutsk", "mongolia", "china"] },
  yakutsk: { name: "Yak Steppe", region: "Asia", x: 700, y: 50, connections: ["siberia", "irkutsk", "kamchatka"] },
  kamchatka: { name: "Crane Marsh", region: "Asia", x: 780, y: 70, connections: ["alaska", "yakutsk", "irkutsk", "mongolia", "japan"] },
  irkutsk: { name: "Sable Forest", region: "Asia", x: 680, y: 110, connections: ["siberia", "yakutsk", "kamchatka", "mongolia"] },
  mongolia: { name: "Wild Horse Range", region: "Asia", x: 700, y: 170, connections: ["siberia", "irkutsk", "kamchatka", "china", "japan"] },
  japan: { name: "Tanuki Garden", region: "Asia", x: 800, y: 180, connections: ["kamchatka", "mongolia"] },
  afghan: { name: "Markhor Summit", region: "Asia", x: 540, y: 190, connections: ["ukraine", "ural", "china", "india", "mideast"] },
  china: { name: "Panda Bamboo", region: "Asia", x: 650, y: 230, connections: ["ural", "siberia", "mongolia", "afghan", "india", "siam"] },
  mideast: { name: "Oryx Desert", region: "Asia", x: 500, y: 260, connections: ["ukraine", "southeur", "egypt", "eastafrica", "afghan", "india"] },
  india: { name: "Elephant Temple", region: "Asia", x: 590, y: 300, connections: ["afghan", "china", "mideast", "siam"] },
  siam: { name: "Gibbon Canopy", region: "Asia", x: 660, y: 330, connections: ["china", "india", "indonesia"] },
  // KANGAROO OUTBACK - 4 territories (+2 bonus) - Bottom right
  indonesia: { name: "Komodo Beach", region: "Australia", x: 700, y: 400, connections: ["siam", "newguinea", "westaus"] },
  newguinea: { name: "Bird of Paradise", region: "Australia", x: 780, y: 380, connections: ["indonesia", "westaus", "eastaus"] },
  westaus: { name: "Wombat Outback", region: "Australia", x: 730, y: 480, connections: ["indonesia", "newguinea", "eastaus"] },
  eastaus: { name: "Koala Grove", region: "Australia", x: 800, y: 500, connections: ["newguinea", "westaus"] }
};
const REGIONS = {
  NorthAmerica: {
    territories: ["alaska", "northwest", "greenland", "alberta", "ontario", "quebec", "westus", "eastus", "centralam"],
    bonus: 5,
    color: "#F59E0B",
    // Yellow/gold
    lightColor: "#FEF3C7",
    darkColor: "#B45309",
    emoji: "🦅"
  },
  SouthAmerica: {
    territories: ["venezuela", "peru", "brazil", "argentina"],
    bonus: 2,
    color: "#EF4444",
    // Red
    lightColor: "#FEE2E2",
    darkColor: "#B91C1C",
    emoji: "🦜"
  },
  Europe: {
    territories: ["iceland", "scandinavia", "ukraine", "britain", "northeur", "westeur", "southeur"],
    bonus: 5,
    color: "#3B82F6",
    // Blue
    lightColor: "#DBEAFE",
    darkColor: "#1D4ED8",
    emoji: "🦌"
  },
  Africa: {
    territories: ["northafrica", "egypt", "eastafrica", "congo", "southafrica", "madagascar"],
    bonus: 3,
    color: "#F97316",
    // Orange
    lightColor: "#FED7AA",
    darkColor: "#C2410C",
    emoji: "🦁"
  },
  Asia: {
    territories: ["ural", "siberia", "yakutsk", "kamchatka", "irkutsk", "mongolia", "japan", "afghan", "china", "mideast", "india", "siam"],
    bonus: 7,
    color: "#10B981",
    // Green
    lightColor: "#D1FAE5",
    darkColor: "#047857",
    emoji: "🐅"
  },
  Australia: {
    territories: ["indonesia", "newguinea", "westaus", "eastaus"],
    bonus: 2,
    color: "#A855F7",
    // Purple
    lightColor: "#F3E8FF",
    darkColor: "#7E22CE",
    emoji: "🦘"
  }
};
const CARD_TYPES = {
  infantry: { name: "Infantry", emoji: "🐾", color: "bg-green-500", description: "Paw Print" },
  cavalry: { name: "Cavalry", emoji: "🦓", color: "bg-blue-500", description: "Zebra" },
  artillery: { name: "Artillery", emoji: "🐘", color: "bg-red-500", description: "Elephant" },
  wild: { name: "Wild", emoji: "🌟", color: "bg-yellow-500", description: "Star - counts as any!" }
};
const CARD_DECK = [
  // Infantry cards (14)
  ...Array(14).fill(null).map((_, i) => ({ id: `inf_${i}`, type: "infantry", ...CARD_TYPES.infantry })),
  // Cavalry cards (14)
  ...Array(14).fill(null).map((_, i) => ({ id: `cav_${i}`, type: "cavalry", ...CARD_TYPES.cavalry })),
  // Artillery cards (14)
  ...Array(14).fill(null).map((_, i) => ({ id: `art_${i}`, type: "artillery", ...CARD_TYPES.artillery })),
  // Wild cards (2)
  ...Array(2).fill(null).map((_, i) => ({ id: `wild_${i}`, type: "wild", ...CARD_TYPES.wild }))
];
const TRADE_IN_VALUES = [4, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const canTradeCards = (cards) => {
  if (cards.length < 3) return false;
  const types = cards.map((c) => c.type);
  const nonWildTypes = types.filter((t) => t !== "wild");
  const wildCount = types.filter((t) => t === "wild").length;
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const combo = [cards[i], cards[j], cards[k]];
        if (isValidTradeSet(combo)) return true;
      }
    }
  }
  return false;
};
const isValidTradeSet = (threeCards) => {
  if (threeCards.length !== 3) return false;
  const types = threeCards.map((c) => c.type);
  const wildCount = types.filter((t) => t === "wild").length;
  const nonWildTypes = types.filter((t) => t !== "wild");
  const uniqueNonWild = [...new Set(nonWildTypes)];
  if (uniqueNonWild.length <= 1) return true;
  if (uniqueNonWild.length + wildCount >= 3 && uniqueNonWild.length === nonWildTypes.length) {
    const allTypes = ["infantry", "cavalry", "artillery"];
    const missingTypes = allTypes.filter((t) => !nonWildTypes.includes(t));
    if (missingTypes.length <= wildCount) return true;
  }
  return false;
};
const findValidTradeSet = (cards) => {
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        const combo = [cards[i], cards[j], cards[k]];
        if (isValidTradeSet(combo)) return [i, j, k];
      }
    }
  }
  return null;
};
const estimateBattleProbability = (attackerTroops, defenderTroops) => {
  if (defenderTroops >= 5 && attackerTroops >= defenderTroops * 3) return 98;
  const SIMULATIONS = 500;
  let attackerWins = 0;
  for (let sim = 0; sim < SIMULATIONS; sim++) {
    let atk = attackerTroops;
    let def = defenderTroops;
    while (atk > 1 && def > 0) {
      const atkDice = Math.min(3, atk - 1);
      const defDice = Math.min(2, def);
      const atkRolls = Array.from({ length: atkDice }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
      const defRolls = Array.from({ length: defDice }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
      const pairs = Math.min(atkRolls.length, defRolls.length);
      for (let i = 0; i < pairs; i++) {
        if (atkRolls[i] > defRolls[i]) {
          def--;
        } else {
          atk--;
        }
      }
    }
    if (def <= 0) attackerWins++;
  }
  return Math.round(attackerWins / SIMULATIONS * 100);
};
const BattleProbabilityDisplay = ({ attackerTroops, defenderTroops }) => {
  const prob = React.useMemo(
    () => estimateBattleProbability(attackerTroops, defenderTroops),
    [attackerTroops, defenderTroops]
  );
  const color = prob >= 60 ? "#22c55e" : prob >= 40 ? "#eab308" : "#ef4444";
  const label = prob >= 70 ? "Strong advantage" : prob >= 55 ? "Slight advantage" : prob >= 45 ? "Even odds" : prob >= 30 ? "Risky" : "Very risky";
  return /* @__PURE__ */ React.createElement("div", { className: "bg-white/30 rounded-lg p-2 mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center text-xs font-bold text-amber-800 mb-1" }, /* @__PURE__ */ React.createElement("span", null, "Win Probability"), /* @__PURE__ */ React.createElement("span", { style: { color } }, prob, "% - ", label)), /* @__PURE__ */ React.createElement("div", { className: "prob-bar" }, /* @__PURE__ */ React.createElement("div", { className: "prob-bar-fill", style: { width: `${prob}%`, backgroundColor: color } })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-[10px] text-amber-600 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "Attacker (", attackerTroops, ")"), /* @__PURE__ */ React.createElement("span", null, "Defender (", defenderTroops, ")")));
};
const Dice = ({ value, color, isRolling }) => {
  const dots = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `w-14 h-14 rounded-lg shadow-lg flex items-center justify-center ${isRolling ? "dice" : ""}`,
      style: { backgroundColor: color }
    },
    /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 100 100", className: "w-10 h-10" }, dots[value]?.map((pos, i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: pos[0], cy: pos[1], r: "10", fill: "white" })))
  );
};
const Card = ({ card, isSelected, onSelect, small }) => {
  const typeInfo = CARD_TYPES[card.type];
  const sizeClass = small ? "w-16 p-2" : "w-24 p-3";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `${sizeClass} bg-white rounded-xl shadow-lg border-4 transition-all cursor-pointer hover:scale-105 ${isSelected ? "border-yellow-400 ring-2 ring-yellow-300" : "border-gray-300"}`,
      onClick: () => onSelect && onSelect(card)
    },
    /* @__PURE__ */ React.createElement("div", { className: `text-center mb-1 ${small ? "text-2xl" : "text-4xl"}` }, typeInfo.emoji),
    /* @__PURE__ */ React.createElement("div", { className: `font-bold text-center text-gray-800 ${small ? "text-xs" : "text-sm"}` }, typeInfo.name),
    /* @__PURE__ */ React.createElement("div", { className: `text-center mt-1 px-1 py-0.5 rounded-full ${typeInfo.color} text-white ${small ? "text-[8px]" : "text-xs"}` }, card.type === "wild" ? "⭐ WILD" : typeInfo.description)
  );
};
const CardTradeModal = ({ cards, onTrade, onCancel, tradeCount, nextTradeValue, mustTrade }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const toggleCard = (card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    }
  };
  const isValidSelection = selectedCards.length === 3 && isValidTradeSet(selectedCards);
  const cardsAfterTrade = cards.length - 3;
  const canClose = !mustTrade || cards.length <= 4;
  return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-label": "Trade cards", className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-amber-100 to-amber-200 p-6 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-center mb-2 game-title text-amber-800" }, "🃏 Trade Cards for Animals! 🃏"), mustTrade && cards.length > 4 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-red-600 font-bold mb-4" }, "⚠️ You have ", cards.length, " cards - must trade until you have 4 or fewer!") : /* @__PURE__ */ React.createElement("p", { className: "text-center text-amber-700 mb-4" }, "Select 3 cards: all same type OR one of each type"), /* @__PURE__ */ React.createElement("div", { className: "bg-green-100 rounded-lg p-3 mb-4 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-800 font-bold" }, "Next trade gives you: ", /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, nextTradeValue), " animals! 🎉"), /* @__PURE__ */ React.createElement("div", { className: "text-green-600 text-sm" }, "(Trade #", tradeCount + 1, ")")), /* @__PURE__ */ React.createElement("div", { className: "bg-white/50 rounded-xl p-4 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-amber-800 mb-2" }, "Your Cards (", cards.length, "):"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 justify-center" }, cards.map((card) => /* @__PURE__ */ React.createElement(
    Card,
    {
      key: card.id,
      card,
      isSelected: selectedCards.find((c) => c.id === card.id),
      onSelect: toggleCard,
      small: true
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "bg-amber-50 rounded-xl p-3 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-amber-800 mb-2" }, "Selected (", selectedCards.length, "/3):"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-center min-h-[80px] items-center" }, selectedCards.length === 0 ? /* @__PURE__ */ React.createElement("span", { className: "text-amber-400" }, "Click cards above to select") : selectedCards.map((card) => /* @__PURE__ */ React.createElement(Card, { key: card.id, card, isSelected: true, onSelect: toggleCard, small: true }))), selectedCards.length === 3 && /* @__PURE__ */ React.createElement("div", { className: `text-center mt-2 font-bold ${isValidSelection ? "text-green-600" : "text-red-600"}` }, isValidSelection ? "✅ Valid set!" : "❌ Must be 3 same OR 3 different types")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onTrade(selectedCards),
      disabled: !isValidSelection,
      className: `px-6 py-3 font-bold rounded-xl shadow-lg transition-all ${isValidSelection ? "bg-green-500 hover:bg-green-600 text-white hover:scale-105" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`
    },
    "🎁 Trade for ",
    nextTradeValue,
    " Animals!"
  ), canClose && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onCancel,
      className: "px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg transition-all"
    },
    "❌ Cancel"
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-4 text-center text-xs text-amber-600" }, /* @__PURE__ */ React.createElement("div", null, "🐾 Infantry | 🦓 Cavalry | 🐘 Artillery | 🌟 Wild (counts as any)"))));
};
function zooLabelNodes(territories, portrait) {
  return Object.entries(territories).map(([id, data]) => ({ id, name: data.name, x: portrait ? 560 - data.y : data.x, y: portrait ? data.x : data.y, r: 28 }));
}
function layoutZooLabels(territories, portrait) {
  const nodes = zooLabelNodes(territories, portrait), font = portrait ? 12 : 14, height = font + 8;
  const bounds = portrait ? { left: -28, right: 588, top: -8, bottom: 912 } : { left: -8, right: 908, top: -8, bottom: 564 };
  const boxes = [];
  const intersects = (a, b, gap = 3) => a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
  const hitsNode = (box, node) => {
    const distance = (x, y) => Math.hypot(x - Math.max(box.x, Math.min(x, box.x + box.width)), y - Math.max(box.y, Math.min(y, box.y + box.height)));
    return distance(node.x, node.y) < node.r + 3 || distance(node.x + 15, node.y + 15) < 15;
  };
  const ordered = [...nodes].sort((a, b) => {
    const density = (n) => nodes.reduce((sum, o) => sum + (Math.hypot(n.x - o.x, n.y - o.y) < 140 ? 1 : 0), 0);
    return density(b) - density(a) || b.name.length - a.name.length || a.id.localeCompare(b.id);
  });
  for (const node of ordered) {
    const width = Math.ceil(node.name.length * font * 0.65 + 14), candidates = [];
    const add = (cx, cy) => candidates.push({ x: cx - width / 2, y: cy - height / 2, width, height });
    add(node.x, node.y + 34 + height / 2);
    add(node.x, node.y - 34 - height / 2);
    add(node.x + 34 + width / 2, node.y);
    add(node.x - 34 - width / 2, node.y);
    for (const radius of [48, 66, 88, 116, 150, 190]) for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12;
      add(node.x + Math.cos(angle) * radius, node.y + Math.sin(angle) * radius);
    }
    const valid = (box) => box.x >= bounds.left && box.y >= bounds.top && box.x + width <= bounds.right && box.y + height <= bounds.bottom && !nodes.some((n) => hitsNode(box, n)) && !boxes.some((b) => intersects(box, b));
    let choices = candidates.filter(valid);
    if (!choices.length) for (let y = bounds.top; y + height <= bounds.bottom; y += 8) for (let x = bounds.left; x + width <= bounds.right; x += 8) {
      const box = { x, y, width, height };
      if (valid(box)) choices.push(box);
    }
    if (!choices.length) throw new Error("No clear map label position for " + node.name);
    choices.sort((a, b) => Math.hypot(a.x + width / 2 - node.x, a.y + height / 2 - node.y) - Math.hypot(b.x + width / 2 - node.x, b.y + height / 2 - node.y));
    boxes.push({ ...choices[0], id: node.id, name: node.name, nodeX: node.x, nodeY: node.y, font });
  }
  return boxes;
}
const ZOO_LABEL_LAYOUTS = { landscape: layoutZooLabels(TERRITORIES, false), portrait: layoutZooLabels(TERRITORIES, true) };
const Territory = ({ id, data, owner, troops, isSelected, isValidTarget, onClick, onHover, onHoverEnd, portrait }) => {
  const army = owner ? ANIMAL_ARMIES[owner] : null;
  const baseColor = army ? army.color : "#6b7280";
  const region = REGIONS[data.region];
  const regionColor = region?.color || "#6b7280";
  return /* @__PURE__ */ React.createElement(
    "g",
    {
      transform: portrait ? `rotate(-90 ${data.x} ${data.y})` : void 0,
      role: "button",
      "aria-label": `${data.name}, ${troops} animals`,
      className: `territory ${isSelected ? "selected" : ""}`,
      onClick: (e) => onClick(id, e.shiftKey),
      onDoubleClick: () => onClick(id, true),
      onMouseEnter: (e) => onHover && onHover(id, e),
      onMouseLeave: () => onHoverEnd && onHoverEnd()
    },
    /* @__PURE__ */ React.createElement("circle", { cx: data.x, cy: data.y, r: portrait ? 42 : 32, fill: "transparent" }),
    (isSelected || isValidTarget) && /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: data.x,
        cy: data.y,
        r: "28",
        fill: "none",
        stroke: isValidTarget ? "#fbbf24" : "#ffffff",
        strokeWidth: "2",
        opacity: "0.9"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: data.x,
        cy: data.y,
        r: "24",
        fill: regionColor
      }
    ),
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: data.x,
        cy: data.y,
        r: "20",
        fill: baseColor,
        stroke: "#000",
        strokeWidth: "1.5"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "ellipse",
      {
        cx: data.x,
        cy: data.y - 5,
        rx: "12",
        ry: "8",
        fill: "white",
        opacity: "0.15"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "text",
      {
        x: data.x,
        y: data.y + 5,
        textAnchor: "middle",
        fill: "white",
        fontSize: "16",
        style: { textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }
      },
      army ? army.emoji : "❓"
    ),
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: data.x + 15,
        cy: data.y + 15,
        r: "12",
        fill: "#000",
        stroke: "#fff",
        strokeWidth: "1.5"
      }
    ),
    /* @__PURE__ */ React.createElement("text", { x: data.x + 15, y: data.y + 19, textAnchor: "middle", fill: "white", fontSize: "10", fontWeight: "bold" }, troops)
  );
};
const GameMap = ({ gameState, selectedTerritory, validTargets, onTerritoryClick, turnPhase, onTerritoryHover, onTerritoryHoverEnd, rippleEffects }) => {
  const [portrait, setPortrait] = useState(() => innerHeight > innerWidth);
  useEffect(() => {
    const refit = () => setPortrait(innerHeight > innerWidth);
    window.addEventListener("resize", refit);
    return () => window.removeEventListener("resize", refit);
  }, []);
  return /* @__PURE__ */ React.createElement("svg", { className: portrait ? "zoo-map portrait-map" : "zoo-map", viewBox: portrait ? "-40 -20 640 940" : "-20 -40 940 640", preserveAspectRatio: "xMidYMid meet", style: { width: "100%", height: "100%" } }, /* @__PURE__ */ React.createElement("g", { transform: portrait ? "translate(560 0) rotate(90)" : void 0 }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("marker", { id: "arrowhead", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto" }, /* @__PURE__ */ React.createElement("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#fbbf24" }))), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "900", height: "560", fill: "#1a3a4a" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "150", cy: "150", rx: "130", ry: "130", fill: REGIONS.NorthAmerica.color, opacity: "0.2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "175", cy: "400", rx: "80", ry: "110", fill: REGIONS.SouthAmerica.color, opacity: "0.2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "410", cy: "140", rx: "100", ry: "90", fill: REGIONS.Europe.color, opacity: "0.2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "430", cy: "380", rx: "90", ry: "130", fill: REGIONS.Africa.color, opacity: "0.2" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "650", cy: "180", rx: "180", ry: "150", fill: REGIONS.Asia.color, opacity: "0.15" }), /* @__PURE__ */ React.createElement("ellipse", { cx: "750", cy: "450", rx: "90", ry: "80", fill: REGIONS.Australia.color, opacity: "0.2" }), !portrait && /* @__PURE__ */ React.createElement("g", { className: "map-region-titles" }, /* @__PURE__ */ React.createElement("text", { x: "150", y: "-22", textAnchor: "middle", fill: REGIONS.NorthAmerica.color, fontSize: "13", fontWeight: "bold" }, REGIONS.NorthAmerica.emoji, " EAGLE RIDGE +", REGIONS.NorthAmerica.bonus), /* @__PURE__ */ React.createElement("text", { x: "175", y: "586", textAnchor: "middle", fill: REGIONS.SouthAmerica.color, fontSize: "13", fontWeight: "bold" }, REGIONS.SouthAmerica.emoji, " PARROT PARADISE +", REGIONS.SouthAmerica.bonus), /* @__PURE__ */ React.createElement("text", { x: "410", y: "-22", textAnchor: "middle", fill: REGIONS.Europe.color, fontSize: "13", fontWeight: "bold" }, REGIONS.Europe.emoji, " DEER WOODS +", REGIONS.Europe.bonus), /* @__PURE__ */ React.createElement("text", { x: "430", y: "586", textAnchor: "middle", fill: REGIONS.Africa.color, fontSize: "13", fontWeight: "bold" }, REGIONS.Africa.emoji, " LION SAVANNA +", REGIONS.Africa.bonus), /* @__PURE__ */ React.createElement("text", { x: "700", y: "-22", textAnchor: "middle", fill: REGIONS.Asia.color, fontSize: "13", fontWeight: "bold" }, REGIONS.Asia.emoji, " TIGER TERRITORY +", REGIONS.Asia.bonus), /* @__PURE__ */ React.createElement("text", { x: "750", y: "586", textAnchor: "middle", fill: REGIONS.Australia.color, fontSize: "13", fontWeight: "bold" }, REGIONS.Australia.emoji, " KANGAROO OUTBACK +", REGIONS.Australia.bonus)), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M 70 70 Q 0 70, 0 300 Q 0 530, 70 530 M 830 70 Q 900 70, 900 300 Q 900 530, 830 530",
      stroke: "#666",
      strokeWidth: "2",
      strokeDasharray: "8,5",
      fill: "none",
      opacity: "0.5"
    }
  ), /* @__PURE__ */ React.createElement("text", { x: "10", y: "300", fill: "#888", fontSize: "10", transform: "rotate(-90, 10, 300)" }, "← Eagle's Peak–Crane Marsh →"), Object.entries(TERRITORIES).map(
    ([id, data]) => data.connections.map((connId) => {
      if (id > connId) return null;
      if (id === "alaska" && connId === "kamchatka" || id === "kamchatka" && connId === "alaska") return null;
      const conn = TERRITORIES[connId];
      if (!conn) return null;
      const sameRegion = data.region === conn.region;
      const regionColor = REGIONS[data.region]?.color || "#666";
      return /* @__PURE__ */ React.createElement(
        "line",
        {
          key: `path-${id}-${connId}`,
          x1: data.x,
          y1: data.y,
          x2: conn.x,
          y2: conn.y,
          stroke: sameRegion ? regionColor : "#555",
          strokeWidth: sameRegion ? "3" : "2",
          strokeLinecap: "round",
          strokeDasharray: sameRegion ? "0" : "6,4",
          opacity: sameRegion ? "0.5" : "0.35"
        }
      );
    })
  ), turnPhase === "fortify" && selectedTerritory && validTargets.map((targetId) => {
    const from = TERRITORIES[selectedTerritory];
    const to = TERRITORIES[targetId];
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offsetStart = 26 / dist;
    const offsetEnd = 30 / dist;
    const x1 = from.x + dx * offsetStart;
    const y1 = from.y + dy * offsetStart;
    const x2 = to.x - dx * offsetEnd;
    const y2 = to.y - dy * offsetEnd;
    return /* @__PURE__ */ React.createElement(
      "line",
      {
        key: `arrow-${targetId}`,
        x1,
        y1,
        x2,
        y2,
        stroke: "#fbbf24",
        strokeWidth: "3",
        strokeDasharray: "8,4",
        markerEnd: "url(#arrowhead)",
        opacity: "0.8",
        className: "fortify-arrow"
      }
    );
  }), Object.entries(TERRITORIES).map(([id, data]) => /* @__PURE__ */ React.createElement(
    Territory,
    {
      key: id,
      portrait,
      id,
      data,
      owner: gameState.territories[id]?.owner,
      troops: gameState.territories[id]?.troops || 0,
      isSelected: selectedTerritory === id,
      isValidTarget: validTargets.includes(id),
      onClick: onTerritoryClick,
      onHover: onTerritoryHover,
      onHoverEnd: onTerritoryHoverEnd
    }
  )), rippleEffects && rippleEffects.map((ripple, i) => /* @__PURE__ */ React.createElement(
    "circle",
    {
      key: `ripple-${ripple.id}-${i}`,
      cx: TERRITORIES[ripple.id]?.x,
      cy: TERRITORIES[ripple.id]?.y,
      r: "24",
      fill: "none",
      stroke: ripple.color,
      strokeWidth: "4",
      className: "territory-ripple",
      style: { animationDelay: `${ripple.delay}ms` }
    }
  ))), /* @__PURE__ */ React.createElement("g", { className: "territory-label-layer", pointerEvents: "none", "aria-hidden": "true" }, (portrait ? ZOO_LABEL_LAYOUTS.portrait : ZOO_LABEL_LAYOUTS.landscape).map((label) => {
    const endX = Math.max(label.x, Math.min(label.nodeX, label.x + label.width)), endY = Math.max(label.y, Math.min(label.nodeY, label.y + label.height));
    const dx = endX - label.nodeX, dy = endY - label.nodeY, length = Math.hypot(dx, dy);
    return /* @__PURE__ */ React.createElement("path", { key: "leader-" + label.id, d: `M ${label.nodeX + dx * Math.min(34, length) / length} ${label.nodeY + dy * Math.min(34, length) / length} L ${endX} ${endY}`, fill: "none", stroke: "#aac5d0", strokeWidth: "1", opacity: ".55" });
  }), (portrait ? ZOO_LABEL_LAYOUTS.portrait : ZOO_LABEL_LAYOUTS.landscape).map((label) => /* @__PURE__ */ React.createElement(
    "g",
    {
      key: label.id,
      pointerEvents: "all",
      className: selectedTerritory === label.id ? "map-name selected-name" : "map-name",
      onClick: (event) => onTerritoryClick(label.id, event.shiftKey),
      onDoubleClick: () => onTerritoryClick(label.id, true),
      onMouseEnter: (event) => onTerritoryHover && onTerritoryHover(label.id, event),
      onMouseLeave: () => onTerritoryHoverEnd && onTerritoryHoverEnd()
    },
    /* @__PURE__ */ React.createElement("rect", { x: label.x, y: label.y, width: label.width, height: label.height, rx: "5", fill: "#0b2030", stroke: "#a4bac7", strokeWidth: ".6" }),
    /* @__PURE__ */ React.createElement("text", { x: label.x + label.width / 2, y: label.y + label.height / 2, dominantBaseline: "central", textAnchor: "middle", fontSize: label.font, fontWeight: "700", fill: "#f5faff" }, label.name)
  ))));
};
const REGION_DISPLAY_NAMES = {
  NorthAmerica: "Eagle Ridge",
  SouthAmerica: "Parrot Paradise",
  Europe: "Deer Woods",
  Africa: "Lion Savanna",
  Asia: "Tiger Territory",
  Australia: "Kangaroo Outback"
};
const PlayerPanel = ({ player, isCurrentPlayer, armies, cards, onTradeCards, canTrade, troops, turnPhase, isAI }) => {
  const cardCounts = {
    infantry: cards.filter((c) => c.type === "infantry").length,
    cavalry: cards.filter((c) => c.type === "cavalry").length,
    artillery: cards.filter((c) => c.type === "artillery").length,
    wild: cards.filter((c) => c.type === "wild").length
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `p-4 rounded-xl ${isCurrentPlayer ? "ring-4 ring-yellow-400 glow" : ""}`,
      style: { backgroundColor: armies.color + "33", borderLeft: `6px solid ${armies.color}` }
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, armies.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-white text-lg" }, player.name), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-200" }, armies.name, " Army")), isCurrentPlayer && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-yellow-300 bounce" }, player.isAI ? "🤖 AI Turn" : "👑 Your Turn!")),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 text-center mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/20 rounded-lg p-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-white" }, player.territories), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-200" }, "Zones")), /* @__PURE__ */ React.createElement("div", { className: "bg-white/20 rounded-lg p-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-white" }, troops), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-200" }, "Animals")), /* @__PURE__ */ React.createElement("div", { className: "bg-white/20 rounded-lg p-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-white" }, cards.length), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-200" }, "Cards"))),
    isCurrentPlayer && cards.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-white mb-2" }, "Your Cards:"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 justify-center mb-2" }, cardCounts.infantry > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-green-500 px-2 py-1 rounded text-white text-xs font-bold" }, "🐾 ×", cardCounts.infantry), cardCounts.cavalry > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-blue-500 px-2 py-1 rounded text-white text-xs font-bold" }, "🦓 ×", cardCounts.cavalry), cardCounts.artillery > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-red-500 px-2 py-1 rounded text-white text-xs font-bold" }, "🐘 ×", cardCounts.artillery), cardCounts.wild > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-500 px-2 py-1 rounded text-white text-xs font-bold" }, "🌟 ×", cardCounts.wild)), turnPhase === "reinforce" && canTrade && !isAI && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onTradeCards,
        className: "w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg shadow transition-all hover:scale-105"
      },
      "🃏 Trade Cards for Animals!"
    ), cards.length >= 5 && turnPhase === "reinforce" && !isAI && /* @__PURE__ */ React.createElement("div", { className: "text-yellow-300 text-xs text-center mt-1 font-bold animate-pulse" }, "⚠️ 5+ cards - Must trade!"))
  );
};
const BattleArmyDisplay = ({ army, troops, diceCount, isAttacker, battlePhase, pendingLosses, isVictory }) => {
  const emoji = ANIMAL_ARMIES[army].emoji;
  const fighterCount = diceCount;
  const guardCount = isAttacker ? 1 : 0;
  const waitingCount = Math.max(0, troops - fighterCount - guardCount);
  const dyingCount = pendingLosses || 0;
  const fighters = [];
  for (let i = 0; i < fighterCount; i++) {
    const isDying = battlePhase === "comparing" && i >= fighterCount - dyingCount;
    fighters.push(
      /* @__PURE__ */ React.createElement("span", { key: `f${i}`, className: "relative inline-block mx-0.5" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-2xl inline-block ${isDying ? "troop-death" : battlePhase === "rolling" ? "troop-ready" : isVictory ? `victory-dance-${i % 5}` : ""}`,
          style: { animationDelay: `${i * 0.12}s` }
        },
        emoji
      ), isDying && /* @__PURE__ */ React.createElement("span", { className: "absolute inset-0 flex items-center justify-center text-2xl explosion-burst" }, "💥"))
    );
  }
  const waiting = [];
  for (let i = 0; i < waitingCount; i++) {
    waiting.push(
      /* @__PURE__ */ React.createElement(
        "span",
        {
          key: `w${i}`,
          className: `text-2xl inline-block mx-0.5 opacity-40 ${isVictory ? `victory-dance-${(fighterCount + i) % 5}` : ""}`,
          style: { animationDelay: `${(fighterCount + i) * 0.12}s` }
        },
        emoji
      )
    );
  }
  const guardIdx = fighterCount + waitingCount;
  const guard = isAttacker ? /* @__PURE__ */ React.createElement(
    "span",
    {
      className: `text-2xl inline-block mx-0.5 opacity-40 ${isVictory ? `victory-dance-${guardIdx % 5}` : "guard-idle"}`,
      style: isVictory ? { animationDelay: `${guardIdx * 0.12}s` } : void 0
    },
    emoji
  ) : null;
  return /* @__PURE__ */ React.createElement("div", { className: `flex-1 ${isAttacker ? "slide-in-left" : "slide-in-right"}` }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl" }, emoji), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-amber-900 text-sm" }, ANIMAL_ARMIES[army].name), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-amber-800" }, troops, " total")), !isVictory && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "bg-white/40 rounded-lg p-2 mb-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-amber-700 mb-1" }, isAttacker ? "Fighting" : "Defending", " (", fighterCount, " ", fighterCount === 1 ? "die" : "dice", ")"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center min-h-[36px] items-center" }, fighters)), waitingCount > 0 && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-amber-600 text-center mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "opacity-60" }, "Waiting:"), " ", waiting), isAttacker && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-amber-600 text-center mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "opacity-60" }, "🏠 Guard:"), " ", guard)), isVictory && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-0.5 mt-1" }, fighters, waiting, guard));
};
const DiceComparison = ({ attackerDice, defenderDice, comparisons, battlePhase, isRolling }) => {
  if (!attackerDice || attackerDice.length === 0) return null;
  const sortedAttacker = [...attackerDice].sort((a, b) => b - a);
  const sortedDefender = [...defenderDice].sort((a, b) => b - a);
  const pairCount = Math.min(sortedAttacker.length, sortedDefender.length);
  const showResults = battlePhase === "comparing" || battlePhase === "resolved";
  return /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold mb-1 text-red-600" }, "⚔️ Attacker"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-center" }, sortedAttacker.map((val, i) => {
    const won = showResults && comparisons && comparisons[i] === "attacker";
    const lost = showResults && comparisons && comparisons[i] === "defender";
    const isPaired = i < pairCount;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: `${isRolling ? "dice" : showResults ? "dice-slam" : ""} ${won ? "die-win" : ""} ${lost ? "die-lose" : ""}`,
        style: { animationDelay: showResults ? `${i * 0.15}s` : "0s" }
      },
      /* @__PURE__ */ React.createElement(Dice, { value: val, color: "#dc2626", isRolling }),
      showResults && isPaired && /* @__PURE__ */ React.createElement("div", { className: `text-xs font-bold mt-0.5 text-center ${won ? "text-green-600" : "text-red-600"}` }, won ? "WIN" : "LOSE")
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-bold text-amber-700" }, "VS")), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold mb-1 text-blue-600" }, "🛡️ Defender"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-center" }, sortedDefender.map((val, i) => {
    const won = showResults && comparisons && comparisons[i] === "defender";
    const lost = showResults && comparisons && comparisons[i] === "attacker";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: i,
        className: `${isRolling ? "dice" : showResults ? "dice-slam" : ""} ${won ? "die-win" : ""} ${lost ? "die-lose" : ""}`,
        style: { animationDelay: showResults ? `${i * 0.15}s` : "0s" }
      },
      /* @__PURE__ */ React.createElement(Dice, { value: val, color: "#2563eb", isRolling }),
      showResults && /* @__PURE__ */ React.createElement("div", { className: `text-xs font-bold mt-0.5 text-center ${won ? "text-green-600" : "text-red-600"}` }, won ? "WIN" : "LOSE")
    );
  })))), showResults && comparisons && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1 mt-3" }, Array.from({ length: pairCount }).map((_, i) => {
    const atkVal = sortedAttacker[i];
    const defVal = sortedDefender[i];
    const winner = comparisons[i];
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "flex items-center gap-2 bg-white/50 rounded-full px-3 py-1 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-red-600" }, "⚔️ ", atkVal), /* @__PURE__ */ React.createElement("span", { className: "text-amber-700" }, "vs"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-blue-600" }, "🛡️ ", defVal), /* @__PURE__ */ React.createElement("span", { className: "text-amber-800" }, "→"), /* @__PURE__ */ React.createElement("span", { className: `font-bold ${winner === "attacker" ? "text-red-600" : "text-blue-600"}` }, winner === "attacker" ? "Attacker!" : "Defender!"));
  })));
};
const BattleModal = ({ attacker, defender, attackingFrom, defendingTo, onRoll, onBlitz, onRetreat, onClaimTerritory, battleResult, attackerDice, defenderDice, isRolling, isVictory, troopsToMove, setTroopsToMove, battlePhase, comparisons, pendingLosses }) => {
  const attackingAnimals = Math.max(0, attacker.troops - 1);
  const attackDiceCount = Math.min(3, attackingAnimals);
  const defendDiceCount = Math.min(2, defender.troops);
  const canContinueBattle = !isVictory && attacker.troops > 1 && defender.troops > 0;
  const cannotAttack = !isVictory && attacker.troops <= 1;
  const buttonsDisabled = isRolling || battlePhase === "comparing";
  const nextAttackDice = canContinueBattle ? Math.min(3, Math.max(0, attacker.troops - 1)) : 0;
  const nextDefendDice = canContinueBattle ? Math.min(2, defender.troops) : 0;
  const minTroopsToMove = 1;
  const maxTroopsToMove = attacker.troops - 1;
  return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-label": "Battle", className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-amber-100 to-amber-200 p-5 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-center mb-1 game-title text-amber-800" }, isVictory ? "🎉 VICTORY! 🎉" : "⚔️ BATTLE TIME! ⚔️"), /* @__PURE__ */ React.createElement("div", { className: "text-center text-sm text-amber-700 mb-4" }, TERRITORIES[attackingFrom].name, " → ", TERRITORIES[defendingTo].name), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2 mb-4" }, /* @__PURE__ */ React.createElement(
    BattleArmyDisplay,
    {
      army: attacker.army,
      troops: attacker.troops,
      diceCount: attackDiceCount,
      isAttacker: true,
      battlePhase,
      pendingLosses: pendingLosses?.attacker || 0,
      isVictory
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center pt-8" }, /* @__PURE__ */ React.createElement("div", { className: `text-3xl ${!isVictory ? "clash-pulse" : ""}` }, isVictory ? "🏆" : "⚔️"), !isVictory && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-amber-700 font-bold mt-1 whitespace-nowrap" }, attackDiceCount, "🎲 vs ", defendDiceCount, "🎲")), /* @__PURE__ */ React.createElement(
    BattleArmyDisplay,
    {
      army: isVictory ? attacker.army : defender.army,
      troops: defender.troops,
      diceCount: defendDiceCount,
      isAttacker: false,
      battlePhase,
      pendingLosses: pendingLosses?.defender || 0,
      isVictory
    }
  )), attackerDice.length > 0 && !isVictory && /* @__PURE__ */ React.createElement(
    DiceComparison,
    {
      attackerDice,
      defenderDice,
      comparisons,
      battlePhase,
      isRolling
    }
  ), battleResult && !isVictory && battlePhase === "resolved" && /* @__PURE__ */ React.createElement("div", { "aria-live": "assertive", role: "alert", className: "text-center mb-3 p-3 bg-white/50 rounded-lg" }, /* @__PURE__ */ React.createElement("div", { className: "text-base font-bold text-amber-900" }, battleResult), canContinueBattle && /* @__PURE__ */ React.createElement("div", { className: "text-sm text-amber-700 mt-1" }, "Next roll: ", nextAttackDice, "🎲 vs ", nextDefendDice, "🎲")), isVictory && /* @__PURE__ */ React.createElement("div", { className: "mb-4 p-4 bg-green-100 rounded-xl" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-green-800 text-lg" }, "How many animals to move?"), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-green-600" }, "(Must leave at least 1 behind to guard)")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setTroopsToMove(Math.max(minTroopsToMove, troopsToMove - 1)),
      className: "w-11 h-11 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-xl",
      disabled: troopsToMove <= minTroopsToMove,
      "aria-label": "Move fewer troops"
    },
    "-"
  ), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl font-bold text-green-700" }, troopsToMove), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-green-600" }, ANIMAL_ARMIES[attacker.army].emoji)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setTroopsToMove(Math.min(maxTroopsToMove, troopsToMove + 1)),
      className: "w-11 h-11 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-xl",
      disabled: troopsToMove >= maxTroopsToMove,
      "aria-label": "Move more troops"
    },
    "+"
  )), /* @__PURE__ */ React.createElement("div", { className: "text-center mt-3 text-sm text-green-700" }, attacker.troops - troopsToMove, " will stay at ", TERRITORIES[attackingFrom].name)), !isVictory && canContinueBattle && !isRolling && battlePhase !== "comparing" && /* @__PURE__ */ React.createElement(
    BattleProbabilityDisplay,
    {
      attackerTroops: attacker.troops,
      defenderTroops: defender.troops
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 justify-center" }, isVictory ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onClaimTerritory(troopsToMove),
      className: "px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 min-h-[44px]"
    },
    "🏆 Claim Territory!"
  ) : canContinueBattle ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRoll,
      disabled: buttonsDisabled,
      className: "px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 min-h-[44px]"
    },
    "🎲 Roll Dice!"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onBlitz,
      disabled: buttonsDisabled,
      className: "px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 min-h-[44px]",
      title: "Auto-roll until you win or can't attack"
    },
    "⚡ Blitz!"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRetreat,
      disabled: buttonsDisabled,
      className: "px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg transition-all min-h-[44px] disabled:opacity-50"
    },
    "🏳️ Retreat"
  )) : cannotAttack ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRetreat,
      disabled: buttonsDisabled,
      className: "px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all min-h-[44px] disabled:opacity-50"
    },
    "😅 Done (No troops left to attack)"
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onRetreat,
      disabled: buttonsDisabled,
      className: "px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg transition-all min-h-[44px] disabled:opacity-50"
    },
    "🏳️ Retreat"
  ))));
};
const CardRewardModal = ({ card, onClose }) => {
  const typeInfo = CARD_TYPES[card.type];
  return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-label": "Card reward", className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-yellow-100 to-yellow-200 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold mb-4 game-title text-yellow-800" }, "🎉 You Won a Card! 🎉"), /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-6xl mb-2" }, typeInfo.emoji), /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-gray-800" }, typeInfo.name), /* @__PURE__ */ React.createElement("div", { className: `inline-block mt-2 px-4 py-1 rounded-full ${typeInfo.color} text-white font-bold` }, card.type === "wild" ? "⭐ WILD - Counts as any!" : typeInfo.description)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-4" }, "Collect 3 of the same type OR one of each type to trade for bonus animals!"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      "aria-label": "Dismiss card reward",
      className: "px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
    },
    "Awesome! 🎊"
  )));
};
const StatsPanel = ({ players, gameStats, onClose }) => {
  const allArmies = players.map((p) => p.army);
  return /* @__PURE__ */ React.createElement("div", { role: "dialog", "aria-label": "Game statistics", className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-600" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-center mb-4 game-title text-yellow-400" }, "Game Statistics"), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto mb-4" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "text-gray-400 border-b border-gray-700" }, /* @__PURE__ */ React.createElement("th", { className: "text-left py-2 px-2" }, "Player"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-2 px-2" }, "Conquered"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-2 px-2" }, "Battles Won"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-2 px-2" }, "Battles Lost"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-2 px-2" }, "Cards Traded"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-2 px-2" }, "Troops Deployed"))), /* @__PURE__ */ React.createElement("tbody", null, players.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id, className: "border-b border-gray-700/50" }, /* @__PURE__ */ React.createElement("td", { className: "py-2 px-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, ANIMAL_ARMIES[p.army]?.emoji), /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold" }, p.name), p.isAI && /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 text-xs" }, "🤖"))), /* @__PURE__ */ React.createElement("td", { className: "text-center text-white font-bold py-2 px-2" }, gameStats.territoriesConquered[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center text-green-400 font-bold py-2 px-2" }, gameStats.battlesWon[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center text-red-400 font-bold py-2 px-2" }, gameStats.battlesLost[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center text-yellow-400 font-bold py-2 px-2" }, gameStats.cardsTraded[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center text-blue-400 font-bold py-2 px-2" }, gameStats.troopsDeployed[p.army] || 0)))))), gameStats.biggestBattle && gameStats.biggestBattle.attackerTroops > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-amber-900/40 rounded-xl p-4 mb-4 border border-amber-700/50" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-400 font-bold text-sm mb-2" }, "Biggest Battle"), /* @__PURE__ */ React.createElement("div", { className: "text-white text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, gameStats.biggestBattle.from), " ", " vs ", " ", /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, gameStats.biggestBattle.to)), /* @__PURE__ */ React.createElement("div", { className: "text-gray-300 text-xs mt-1" }, gameStats.biggestBattle.attackerTroops, " attackers vs ", gameStats.biggestBattle.defenderTroops, " defenders", gameStats.biggestBattle.winner && ` - Won by ${gameStats.biggestBattle.winner}`)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl shadow-lg transition-all"
    },
    "Close"
  ))));
};
const TerritoryTooltip = ({ info }) => {
  if (!info) return null;
  const style = {
    left: Math.min(info.x, window.innerWidth - 260),
    top: Math.max(10, info.y - 120)
  };
  return /* @__PURE__ */ React.createElement("div", { className: "territory-tooltip", style }, /* @__PURE__ */ React.createElement("div", { className: "tt-name", style: { color: info.ownerColor } }, info.ownerEmoji, " ", info.name), /* @__PURE__ */ React.createElement("div", { className: "tt-row" }, /* @__PURE__ */ React.createElement("span", { className: "tt-label" }, "Region:"), /* @__PURE__ */ React.createElement("span", null, info.region)), /* @__PURE__ */ React.createElement("div", { className: "tt-row" }, /* @__PURE__ */ React.createElement("span", { className: "tt-label" }, "Owner:"), /* @__PURE__ */ React.createElement("span", { style: { color: info.ownerColor } }, info.owner)), /* @__PURE__ */ React.createElement("div", { className: "tt-row" }, /* @__PURE__ */ React.createElement("span", { className: "tt-label" }, "Troops:"), /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, info.troops)), /* @__PURE__ */ React.createElement("div", { className: "tt-row" }, /* @__PURE__ */ React.createElement("span", { className: "tt-label" }, "Adjacent Enemies:"), /* @__PURE__ */ React.createElement("span", { className: "text-red-400 font-bold" }, info.adjacentEnemies)), /* @__PURE__ */ React.createElement("div", { className: "tt-row" }, /* @__PURE__ */ React.createElement("span", { className: "tt-label" }, "Adjacent Allies:"), /* @__PURE__ */ React.createElement("span", { className: "text-green-400 font-bold" }, info.adjacentAllies)));
};
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e", color: "#fff", flexDirection: "column", fontFamily: "sans-serif" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "3rem", marginBottom: "1rem" } }, "😿"), /* @__PURE__ */ React.createElement("h2", { style: { marginBottom: "0.5rem" } }, "Something went wrong"), /* @__PURE__ */ React.createElement("button", { onClick: () => window.location.reload(), style: { padding: "0.75rem 2rem", background: "#f59e0b", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" } }, "Reload Game"));
    }
    return this.props.children;
  }
}
const ZooRiskGame = () => {
  const [gamePhase, setGamePhase] = useState("setup");
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameState, setGameState] = useState({ territories: {} });
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [inspectedTerritory, setInspectedTerritory] = useState(null);
  const [troopsToPlace, setTroopsToPlace] = useState(0);
  const [turnPhase, setTurnPhase] = useState("reinforce");
  const [battleState, setBattleState] = useState(null);
  const [cardReward, setCardReward] = useState(null);
  const [playerCards, setPlayerCards] = useState({});
  const [conqueredThisTurn, setConqueredThisTurn] = useState(false);
  const [earnedCardThisTurn, setEarnedCardThisTurn] = useState(false);
  const [message, setMessageRaw] = useState("Welcome to Zoo Conquest!");
  const [gameLog, setGameLog] = useState([{ text: "Welcome to Zoo Conquest!", time: Date.now() }]);
  const [soundMuted, setSoundMuted] = useState(false);
  const gameLogRef = React.useRef(null);
  const [aiThinking, setAiThinking] = useState(false);
  const SAVE_KEY = "zoo-conquest-save-v2";
  const [setupLength, setSetupLength] = useState("30");
  const [setupScenario, setSetupScenario] = useState("open");
  const [activeLength, setActiveLength] = useState("30");
  const [activeScenario, setActiveScenario] = useState("open");
  const [gameDeadline, setGameDeadline] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [winnerArmy, setWinnerArmy] = useState(null);
  const [hasSavedGame, setHasSavedGame] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch (_) {
      return false;
    }
  });
  const setMessage = useCallback((msg) => {
    setMessageRaw(msg);
    setGameLog((prev) => [...prev.slice(-49), { text: msg, time: Date.now() }]);
  }, []);
  const [showCardTrade, setShowCardTrade] = useState(false);
  const [mustTradeCards, setMustTradeCards] = useState(false);
  const [tradeCount, setTradeCount] = useState(0);
  const [cardDeck, setCardDeck] = useState(shuffleArray(CARD_DECK));
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [aiSpeedFast, setAiSpeedFast] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [rippleEffects, setRippleEffects] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [gameStats, setGameStats] = useState({
    territoriesConquered: {},
    // per army
    battlesWon: {},
    battlesLost: {},
    cardsTraded: {},
    troopsDeployed: {},
    biggestBattle: { attackerTroops: 0, defenderTroops: 0, from: "", to: "", winner: "" }
  });
  const startGame = (numHumans, numAI) => {
    setInspectedTerritory(null);
    const totalPlayers = numHumans + numAI;
    const allArmyKeys = Object.keys(ANIMAL_ARMIES);
    const aiNames = ["Captain Claw", "Baron Beak", "Duke Fang", "Lady Paw", "Sir Scales"];
    const personalities = ["Aggressive", "Fortress", "Opportunist", "Balanced", "Trickster"];
    const chosenByHumans = [];
    for (let i = 0; i < numHumans; i++) {
      chosenByHumans.push(humanArmyChoices[i] || null);
    }
    const usedArmies = new Set(chosenByHumans.filter(Boolean));
    const availableArmies = allArmyKeys.filter((a) => !usedArmies.has(a));
    const humanArmies = chosenByHumans.map((choice) => {
      if (choice) return choice;
      const pick = availableArmies.shift();
      usedArmies.add(pick);
      return pick;
    });
    const aiArmies = allArmyKeys.filter((a) => !usedArmies.has(a)).slice(0, numAI);
    const armies = [...humanArmies, ...aiArmies];
    const newPlayers = armies.map((army, i) => {
      const isHuman = i < numHumans;
      const aiIndex = i - numHumans;
      return {
        id: i,
        name: isHuman ? numHumans === 1 ? "You" : `Player ${i + 1}` : aiNames[aiIndex],
        army,
        territories: 0,
        isAI: !isHuman,
        personality: isHuman ? null : personalities[aiIndex % personalities.length]
      };
    });
    const territoryIds = Object.keys(TERRITORIES);
    const shuffled = setupScenario === "regions" ? Object.values(REGIONS).flatMap((region) => region.territories) : shuffleArray(territoryIds);
    const newTerritories = {};
    shuffled.forEach((id, i) => {
      const playerIdx = setupScenario === "regions" ? Math.floor(i / Math.max(1, Math.ceil(shuffled.length / totalPlayers))) % totalPlayers : i % totalPlayers;
      newTerritories[id] = {
        owner: armies[playerIdx],
        troops: setupScenario === "laststand" ? playerIdx === 0 ? 3 : 2 : 1
      };
    });
    newPlayers.forEach((p) => {
      p.territories = Object.values(newTerritories).filter((t) => t.owner === p.army).length;
    });
    const cards = {};
    armies.forEach((army) => cards[army] = []);
    setPlayers(newPlayers);
    setGameState({ territories: newTerritories });
    setPlayerCards(cards);
    setGamePhase("play");
    setActiveLength(setupLength);
    setActiveScenario(setupScenario);
    const deadline = Date.now() + Number(setupLength) * 60 * 1e3;
    setGameDeadline(deadline);
    setTimeRemaining(Number(setupLength) * 60);
    setWinnerArmy(null);
    setTurnPhase("reinforce");
    setCurrentPlayerIndex(0);
    setConqueredThisTurn(false);
    setEarnedCardThisTurn(false);
    setTradeCount(0);
    setCardDeck(shuffleArray(CARD_DECK));
    setBattleState(null);
    setCardReward(null);
    setSelectedTerritory(null);
    setShowCardTrade(false);
    setMustTradeCards(false);
    setGameLog([{ text: "Game started!", time: Date.now() }]);
    setGameStats({
      territoriesConquered: {},
      battlesWon: {},
      battlesLost: {},
      cardsTraded: {},
      troopsDeployed: {},
      biggestBattle: { attackerTroops: 0, defenderTroops: 0, from: "", to: "", winner: "" }
    });
    setHumanArmyChoices({});
    const initialTroops = calculateReinforcements(newPlayers[0], newTerritories);
    setTroopsToPlace(initialTroops);
    const firstPlayer = newPlayers[0];
    if (firstPlayer.isAI) {
      setMessage(`🤖 ${firstPlayer.name}'s turn!`);
    } else {
      setMessage(`Your turn! Place your ${initialTroops} animals.`);
    }
  };
  const calculateReinforcements = (player, territories) => {
    const count = Object.values(territories).filter((t) => t.owner === player.army).length;
    let troops = Math.max(3, Math.floor(count / 3));
    Object.entries(REGIONS).forEach(([name, region]) => {
      const ownsAll = region.territories.every((t) => territories[t]?.owner === player.army);
      if (ownsAll) troops += region.bonus;
    });
    return troops;
  };
  const drawCard = () => {
    if (cardDeck.length === 0) {
      const held = new Set(Object.values(playerCards).flat().map((c) => c.id));
      const reshuffled = shuffleArray(CARD_DECK.filter((c) => !held.has(c.id)));
      const card2 = reshuffled[0];
      setCardDeck(reshuffled.slice(1));
      return card2;
    }
    const card = cardDeck[0];
    setCardDeck((prev) => prev.slice(1));
    return card;
  };
  const handleCardTrade = (selectedCards) => {
    if (!isValidTradeSet(selectedCards)) return;
    SoundSystem.cardTrade();
    trackStat("cardsTraded", currentPlayer.army);
    const army = currentPlayer.army;
    const bonusTroops = TRADE_IN_VALUES[Math.min(tradeCount, TRADE_IN_VALUES.length - 1)];
    const cardIds = selectedCards.map((c) => c.id);
    const currentCards = playerCards[army] || [];
    const remainingCards = currentCards.filter((c) => !cardIds.includes(c.id));
    setPlayerCards((prev) => ({
      ...prev,
      [army]: remainingCards
    }));
    setTroopsToPlace((prev) => prev + bonusTroops);
    setTradeCount((prev) => prev + 1);
    if (mustTradeCards && remainingCards.length > 4 && canTradeCards(remainingCards)) {
      setMessage(`🎁 +${bonusTroops} animals! Still have ${remainingCards.length} cards - must trade to 4 or fewer!`);
    } else {
      setShowCardTrade(false);
      setMustTradeCards(false);
      if (turnPhase === "attack") setTurnPhase("reinforce");
      setMessage(`🎁 Traded cards for ${bonusTroops} extra animals! Place your animals.`);
    }
  };
  const getNextTradeValue = () => {
    return TRADE_IN_VALUES[Math.min(tradeCount, TRADE_IN_VALUES.length - 1)];
  };
  const canCurrentPlayerTrade = () => {
    if (!currentPlayer) return false;
    const cards = playerCards[currentPlayer.army] || [];
    return canTradeCards(cards);
  };
  const currentPlayer = players[currentPlayerIndex];
  const currentArmy = currentPlayer ? ANIMAL_ARMIES[currentPlayer.army] : null;
  const getPlayerTroops = (army) => {
    return Object.values(gameState.territories).filter((t) => t.owner === army).reduce((sum, t) => sum + t.troops, 0);
  };
  const getValidTargets = () => {
    if (!selectedTerritory || turnPhase !== "attack") return [];
    const territory = TERRITORIES[selectedTerritory];
    const myArmy = gameState.territories[selectedTerritory]?.owner;
    return territory.connections.filter(
      (connId) => gameState.territories[connId]?.owner !== myArmy
    );
  };
  const getValidFortifyTargets = () => {
    if (!selectedTerritory || turnPhase !== "fortify") return [];
    const myArmy = gameState.territories[selectedTerritory]?.owner;
    if (!myArmy) return [];
    const visited = /* @__PURE__ */ new Set();
    const queue = [selectedTerritory];
    visited.add(selectedTerritory);
    while (queue.length > 0) {
      const current = queue.shift();
      const connections = TERRITORIES[current].connections;
      for (const connId of connections) {
        if (!visited.has(connId) && gameState.territories[connId]?.owner === myArmy) {
          visited.add(connId);
          queue.push(connId);
        }
      }
    }
    visited.delete(selectedTerritory);
    return Array.from(visited);
  };
  const handleTerritoryHover = useCallback((id, e) => {
    if (!CAN_HOVER) return;
    const svgEl = e.target.closest("svg");
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const territory = TERRITORIES[id];
    const terr = gameState.territories[id];
    if (!territory || !terr) return;
    const scaleX = rect.width / 900;
    const scaleY = rect.height / 560;
    const screenX = rect.left + territory.x * scaleX + 30;
    const screenY = rect.top + territory.y * scaleY - 10;
    const ownerArmy = terr.owner;
    const connections = territory.connections;
    const adjacentEnemies = connections.filter((c) => gameState.territories[c]?.owner !== ownerArmy).length;
    const adjacentAllies = connections.filter((c) => gameState.territories[c]?.owner === ownerArmy).length;
    setTooltipInfo({
      id,
      x: screenX,
      y: screenY,
      name: territory.name,
      region: REGION_DISPLAY_NAMES[territory.region] || territory.region,
      troops: terr.troops,
      owner: ownerArmy ? ANIMAL_ARMIES[ownerArmy]?.name : "Unowned",
      ownerEmoji: ownerArmy ? ANIMAL_ARMIES[ownerArmy]?.emoji : "?",
      ownerColor: ownerArmy ? ANIMAL_ARMIES[ownerArmy]?.color : "#666",
      adjacentEnemies,
      adjacentAllies
    });
  }, [gameState.territories]);
  const handleTerritoryHoverEnd = useCallback(() => {
    setTooltipInfo(null);
  }, []);
  const triggerConquestRipple = useCallback((conqueredId, color) => {
    const ripples = [{ id: conqueredId, color, delay: 0 }];
    const connections = TERRITORIES[conqueredId]?.connections || [];
    connections.forEach((connId, i) => {
      ripples.push({ id: connId, color, delay: (i + 1) * 120 });
    });
    setRippleEffects(ripples);
    setTimeout(() => setRippleEffects([]), 1500);
  }, []);
  const trackStat = useCallback((category, army, amount = 1) => {
    setGameStats((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [army]: (prev[category]?.[army] || 0) + amount
      }
    }));
  }, []);
  const lastTapRef = React.useRef({ id: null, time: 0 });
  const handleTerritoryClick = (id, placeAll = false) => {
    setInspectedTerritory(id);
    setTooltipInfo(null);
    if (currentPlayer?.isAI) {
      return;
    }
    const now = Date.now();
    if (!placeAll && lastTapRef.current.id === id && now - lastTapRef.current.time < 300) {
      placeAll = true;
    }
    lastTapRef.current = { id, time: now };
    const territory = gameState.territories[id];
    if (turnPhase === "reinforce" && territory?.owner === currentPlayer?.army && troopsToPlace > 0) {
      const toPlace = placeAll ? troopsToPlace : 1;
      SoundSystem.placeTroop();
      trackStat("troopsDeployed", currentPlayer.army, toPlace);
      setGameState((prev) => ({
        ...prev,
        territories: {
          ...prev.territories,
          [id]: { ...prev.territories[id], troops: prev.territories[id].troops + toPlace }
        }
      }));
      setTroopsToPlace((prev) => prev - toPlace);
      if (troopsToPlace - toPlace <= 0) {
        setTurnPhase("attack");
        setMessage("Attack phase! Select a territory to attack from.");
      } else if (placeAll) {
        setTurnPhase("attack");
        setMessage("Attack phase! Select a territory to attack from.");
      }
    } else if (turnPhase === "attack") {
      if (selectedTerritory === null) {
        if (territory?.owner === currentPlayer?.army && territory?.troops > 1) {
          setSelectedTerritory(id);
          setMessage("Now select an enemy territory to attack!");
        }
      } else if (selectedTerritory === id) {
        setSelectedTerritory(null);
        setMessage("Select a territory to attack from.");
      } else {
        const validTargets = getValidTargets();
        if (validTargets.includes(id)) {
          startBattle(selectedTerritory, id);
        }
      }
    } else if (turnPhase === "fortify") {
      if (selectedTerritory === null) {
        if (territory?.owner === currentPlayer?.army && territory?.troops > 1) {
          setSelectedTerritory(id);
          setMessage("Select an adjacent friendly territory to send troops to.");
        }
      } else if (selectedTerritory === id) {
        setSelectedTerritory(null);
        setMessage("Select a territory to fortify from, or end turn.");
      } else {
        const validTargets = getValidFortifyTargets();
        if (validTargets.includes(id)) {
          const fromTroop = gameState.territories[selectedTerritory].troops;
          const toMove = Math.floor((fromTroop - 1) / 2) + 1;
          setGameState((prev) => ({
            ...prev,
            territories: {
              ...prev.territories,
              [selectedTerritory]: { ...prev.territories[selectedTerritory], troops: fromTroop - toMove },
              [id]: { ...prev.territories[id], troops: prev.territories[id].troops + toMove }
            }
          }));
          setSelectedTerritory(null);
          setMessage(`Moved ${toMove} troops from ${TERRITORIES[selectedTerritory].name} to ${TERRITORIES[id].name}.`);
        }
      }
    }
  };
  const startBattle = (from, to) => {
    setBattleState({
      from,
      to,
      attackerTroops: gameState.territories[from].troops,
      defenderTroops: gameState.territories[to].troops,
      attackerDice: [],
      defenderDice: [],
      isRolling: false,
      result: null,
      isVictory: false,
      troopsToMove: 1,
      battlePhase: null,
      comparisons: null,
      pendingLosses: null
    });
  };
  const getPlayerTerritories = (army) => {
    return Object.entries(gameState.territories).filter(([id, t]) => t.owner === army).map(([id, t]) => ({ id, ...t }));
  };
  const aiFindBestReinforceTarget = (army, territories) => {
    const personality = players.find((player) => player.army === army)?.personality || "Balanced";
    const myTerritories = Object.entries(territories).filter(([id, t]) => t.owner === army).map(([id, t]) => ({ id, ...t }));
    let bestTarget = null;
    let bestScore = -1;
    myTerritories.forEach((territory) => {
      const connections = TERRITORIES[territory.id].connections;
      const enemyNeighbors = connections.filter(
        (connId) => territories[connId]?.owner !== army
      ).length;
      const borderWeight = personality === "Fortress" ? 16 : personality === "Aggressive" ? 8 : 10;
      const score = enemyNeighbors * borderWeight - territory.troops + (personality === "Opportunist" ? connections.length : 0);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = territory.id;
      }
    });
    return bestTarget || myTerritories[0]?.id;
  };
  const aiFindBestAttack = (army) => {
    const personality = players.find((player) => player.army === army)?.personality || "Balanced";
    const myTerritories = getPlayerTerritories(army);
    let bestAttack = null;
    let bestScore = -1;
    myTerritories.forEach((territory) => {
      if (territory.troops <= 1) return;
      const connections = TERRITORIES[territory.id].connections;
      connections.forEach((targetId) => {
        const target = gameState.territories[targetId];
        if (target?.owner === army) return;
        const myAttackers = territory.troops - 1;
        const theirDefenders = target.troops;
        const advantage = myAttackers - theirDefenders;
        const threshold = personality === "Aggressive" ? -1 : personality === "Fortress" ? 2 : 0;
        if (advantage >= threshold || myAttackers >= 3 && theirDefenders <= 2) {
          const regionPressure = Object.values(REGIONS).some((region) => region.territories.includes(targetId) && region.territories.filter((id) => gameState.territories[id]?.owner === army).length === region.territories.length - 1) ? 5 : 0;
          const score = advantage + myAttackers * 2 + (personality === "Opportunist" ? regionPressure : 0) + (personality === "Trickster" ? Math.random() * 4 : 0);
          if (score > bestScore) {
            bestScore = score;
            bestAttack = { from: territory.id, to: targetId };
          }
        }
      });
    });
    return bestAttack;
  };
  const aiFindBestFortify = (army) => {
    const personality = players.find((player) => player.army === army)?.personality || "Balanced";
    const myTerritories = getPlayerTerritories(army);
    let bestMove = null;
    let bestScore = -1;
    myTerritories.forEach((from) => {
      if (from.troops <= 1) return;
      const connections = TERRITORIES[from.id].connections;
      const fromEnemyNeighbors = connections.filter(
        (id) => gameState.territories[id]?.owner !== army
      ).length;
      if (fromEnemyNeighbors === 0) {
        connections.forEach((toId) => {
          const to = gameState.territories[toId];
          if (to?.owner !== army) return;
          const toConnections = TERRITORIES[toId].connections;
          const toEnemyNeighbors = toConnections.filter(
            (id) => gameState.territories[id]?.owner !== army
          ).length;
          if (toEnemyNeighbors > 0) {
            const score = toEnemyNeighbors * 10 + (from.troops - 1);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { from: from.id, to: toId, troops: personality === "Fortress" ? Math.max(1, Math.floor((from.troops - 1) / 2)) : from.troops - 1 };
            }
          }
        });
      }
    });
    return bestMove;
  };
  const aiExecuteBattle = (from, to) => {
    return new Promise((resolve) => {
      const attackerTroops = gameState.territories[from].troops;
      const defenderTroops = gameState.territories[to].troops;
      const attackerMax = Math.min(3, attackerTroops - 1);
      const defenderMax = Math.min(2, defenderTroops);
      const attackerDice = Array.from({ length: attackerMax }, () => Math.floor(Math.random() * 6) + 1);
      const defenderDice = Array.from({ length: defenderMax }, () => Math.floor(Math.random() * 6) + 1);
      const sortedAttacker = [...attackerDice].sort((a, b) => b - a);
      const sortedDefender = [...defenderDice].sort((a, b) => b - a);
      let attackerLosses = 0;
      let defenderLosses = 0;
      const comparisons = Math.min(sortedAttacker.length, sortedDefender.length);
      for (let i = 0; i < comparisons; i++) {
        if (sortedAttacker[i] > sortedDefender[i]) {
          defenderLosses++;
        } else {
          attackerLosses++;
        }
      }
      const newAttackerTroops = attackerTroops - attackerLosses;
      const newDefenderTroops = defenderTroops - defenderLosses;
      const victory = newDefenderTroops <= 0;
      resolve({
        attackerDice,
        defenderDice,
        attackerLosses,
        defenderLosses,
        newAttackerTroops,
        newDefenderTroops,
        victory
      });
    });
  };
  useEffect(() => {
    if (gamePhase !== "play" || !currentPlayer?.isAI || battleState || cardReward || aiThinking) {
      return;
    }
    const runAITurn = async () => {
      setAiThinking(true);
      const army = currentPlayer.army;
      const aiName = currentPlayer.name;
      let aiTroopsToPlace = troopsToPlace;
      if (turnPhase === "reinforce") {
        const aiCards = playerCards[army] || [];
        if (aiCards.length >= 5 || aiCards.length >= 3 && canTradeCards(aiCards)) {
          let currentCards = [...aiCards];
          let totalBonusTroops = 0;
          let currentTradeCount = tradeCount;
          let trades = 0;
          while (currentCards.length >= 3 && canTradeCards(currentCards)) {
            const tradeIndices = findValidTradeSet(currentCards);
            if (!tradeIndices) break;
            const bonusTroops = TRADE_IN_VALUES[Math.min(currentTradeCount, TRADE_IN_VALUES.length - 1)];
            totalBonusTroops += bonusTroops;
            currentTradeCount++;
            trades++;
            const sortedIndices = [...tradeIndices].sort((a, b) => b - a);
            for (const idx of sortedIndices) {
              currentCards.splice(idx, 1);
            }
            if (currentCards.length < 5) break;
          }
          if (trades > 0) {
            setPlayerCards((prev) => ({
              ...prev,
              [army]: currentCards
            }));
            setTradeCount(currentTradeCount);
            setTroopsToPlace((prev) => prev + totalBonusTroops);
            aiTroopsToPlace += totalBonusTroops;
            SoundSystem.cardTrade();
            trackStat("cardsTraded", army, trades);
            setMessage(`🤖 ${aiName} traded ${trades} card set${trades > 1 ? "s" : ""} for +${totalBonusTroops} animals!`);
            await new Promise((r) => setTimeout(r, aiSpeedFast ? 30 : 300));
          }
        }
      }
      if (turnPhase === "reinforce" && aiTroopsToPlace > 0) {
        setMessage(`🤖 ${aiName} placing ${aiTroopsToPlace} reinforcements...`);
        trackStat("troopsDeployed", army, aiTroopsToPlace);
        const localTerritories = {};
        Object.entries(gameState.territories).forEach(([id, t]) => {
          localTerritories[id] = { ...t };
        });
        const reinforcements = {};
        for (let i = 0; i < aiTroopsToPlace; i++) {
          const target = aiFindBestReinforceTarget(army, localTerritories);
          if (target) {
            reinforcements[target] = (reinforcements[target] || 0) + 1;
            localTerritories[target] = { ...localTerritories[target], troops: localTerritories[target].troops + 1 };
          }
        }
        setGameState((prev) => {
          const newTerritories = { ...prev.territories };
          Object.entries(reinforcements).forEach(([tid, count]) => {
            newTerritories[tid] = { ...newTerritories[tid], troops: newTerritories[tid].troops + count };
          });
          return { ...prev, territories: newTerritories };
        });
        await new Promise((r) => setTimeout(r, aiSpeedFast ? 15 : 150));
        setTroopsToPlace(0);
        setTurnPhase("attack");
        setMessage(`🤖 ${aiName} attacking...`);
        setAiThinking(false);
        return;
      }
      if (turnPhase === "attack") {
        const attack = aiFindBestAttack(army);
        if (attack) {
          setMessage(`🤖 ${aiName} ⚔️ ${TERRITORIES[attack.to].name}`);
          await new Promise((r) => setTimeout(r, aiSpeedFast ? 20 : 200));
          const result = await aiExecuteBattle(attack.from, attack.to);
          const defeatedArmy = gameState.territories[attack.to]?.owner;
          const newTerritories = { ...gameState.territories };
          newTerritories[attack.from] = {
            ...newTerritories[attack.from],
            troops: result.newAttackerTroops
          };
          if (result.victory) {
            const troopsToMove = Math.max(1, result.newAttackerTroops - 1);
            newTerritories[attack.to] = {
              owner: army,
              troops: troopsToMove
            };
            newTerritories[attack.from].troops -= troopsToMove;
            setConqueredThisTurn(true);
            trackStat("territoriesConquered", army);
            trackStat("battlesWon", army);
            if (defeatedArmy) trackStat("battlesLost", defeatedArmy);
            triggerConquestRipple(attack.to, ANIMAL_ARMIES[army]?.color || "#fff");
            const defenderTerritories = Object.values(newTerritories).filter((t) => t.owner === defeatedArmy);
            if (defenderTerritories.length === 0 && defeatedArmy) {
              const eliminatedCards = playerCards[defeatedArmy] || [];
              if (eliminatedCards.length > 0) {
                setPlayerCards((prevCards) => ({
                  ...prevCards,
                  [army]: [...prevCards[army] || [], ...eliminatedCards],
                  [defeatedArmy]: []
                }));
                setMessage(`🤖 ${aiName} took ${TERRITORIES[attack.to].name}! 💀 Eliminated player - took ${eliminatedCards.length} cards!`);
              } else {
                setMessage(`🤖 ${aiName} took ${TERRITORIES[attack.to].name}! 💀 Player eliminated!`);
              }
            } else {
              setMessage(`🤖 ${aiName} took ${TERRITORIES[attack.to].name}!`);
            }
          } else {
            newTerritories[attack.to] = {
              ...newTerritories[attack.to],
              troops: result.newDefenderTroops
            };
          }
          setGameState({ territories: newTerritories });
          const owners = new Set(Object.values(newTerritories).map((t) => t.owner));
          if (owners.size === 1) {
            setGamePhase("gameOver");
            setAiThinking(false);
            return;
          }
          await new Promise((r) => setTimeout(r, aiSpeedFast ? 25 : 250));
          setAiThinking(false);
          return;
        } else {
          setTurnPhase("fortify");
          setMessage(`🤖 ${aiName} fortifying...`);
          setAiThinking(false);
          return;
        }
      }
      if (turnPhase === "fortify") {
        await new Promise((r) => setTimeout(r, aiSpeedFast ? 10 : 100));
        const fortify = aiFindBestFortify(army);
        if (fortify) {
          setGameState((prev) => ({
            ...prev,
            territories: {
              ...prev.territories,
              [fortify.from]: { ...prev.territories[fortify.from], troops: prev.territories[fortify.from].troops - fortify.troops },
              [fortify.to]: { ...prev.territories[fortify.to], troops: prev.territories[fortify.to].troops + fortify.troops }
            }
          }));
          setMessage(`🤖 ${aiName} fortified ${TERRITORIES[fortify.to].name}`);
          await new Promise((r) => setTimeout(r, aiSpeedFast ? 15 : 150));
        }
        await new Promise((r) => setTimeout(r, aiSpeedFast ? 10 : 100));
        if (conqueredThisTurn) {
          const card = drawCard();
          if (card) {
            setPlayerCards((prev) => ({
              ...prev,
              [army]: [...prev[army] || [], card]
            }));
          }
        }
        const nextIndex = (currentPlayerIndex + 1) % players.length;
        let idx = nextIndex;
        let attempts = 0;
        while (attempts < players.length) {
          const playerArmy = players[idx].army;
          const hasTerritories = Object.values(gameState.territories).some((t) => t.owner === playerArmy);
          if (hasTerritories) break;
          idx = (idx + 1) % players.length;
          attempts++;
        }
        setCurrentPlayerIndex(idx);
        setConqueredThisTurn(false);
        setEarnedCardThisTurn(false);
        const nextPlayer = players[idx];
        const newTroops = calculateReinforcements(nextPlayer, gameState.territories);
        setTroopsToPlace(newTroops);
        setTurnPhase("reinforce");
        const nextPlayerCards = playerCards[nextPlayer.army] || [];
        if (nextPlayer.isAI) {
          setMessage(`🤖 ${nextPlayer.name}'s turn!`);
        } else if (nextPlayerCards.length >= 5 && canTradeCards(nextPlayerCards)) {
          setMessage(`Your turn! You have ${nextPlayerCards.length} cards - you MUST trade first!`);
          setMustTradeCards(true);
          setShowCardTrade(true);
        } else {
          setMessage(`Your turn! Place your ${newTroops} animals.`);
        }
        setAiThinking(false);
        setPlayers((prev) => prev.map((p) => ({
          ...p,
          territories: Object.values(gameState.territories).filter((t) => t.owner === p.army).length
        })));
        return;
      }
      setAiThinking(false);
    };
    const timer = setTimeout(runAITurn, aiSpeedFast ? 15 : 150);
    return () => clearTimeout(timer);
  }, [gamePhase, currentPlayer, turnPhase, troopsToPlace, battleState, cardReward, aiThinking, gameState.territories, aiSpeedFast]);
  useEffect(() => {
    if (gameLogRef.current) {
      gameLogRef.current.scrollTop = gameLogRef.current.scrollHeight;
    }
  }, [gameLog]);
  useEffect(() => {
    const handler = (e) => {
      if (gamePhase === "play") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [gamePhase]);
  useEffect(() => {
    if (gamePhase !== "play" || !gameDeadline) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((gameDeadline - Date.now()) / 1e3));
      setTimeRemaining(seconds);
      if (seconds <= 0) {
        const counts = players.map((player) => ({ army: player.army, count: Object.values(gameState.territories).filter((t) => t.owner === player.army).length }));
        counts.sort((a, b) => b.count - a.count);
        setWinnerArmy(counts[0]?.army || null);
        setGamePhase("gameOver");
      }
    };
    tick();
    const timer = setInterval(tick, 1e3);
    return () => clearInterval(timer);
  }, [gamePhase, gameDeadline, players, gameState.territories]);
  useEffect(() => {
    if (gamePhase !== "play") return;
    const startingShare = Math.ceil(Object.keys(TERRITORIES).length / Math.max(2, players.length));
    const target = activeLength === "15" ? startingShare + 5 : activeLength === "30" ? startingShare + 10 : Object.keys(TERRITORIES).length;
    const leader = players.find((player) => Object.values(gameState.territories).filter((t) => t.owner === player.army).length >= target);
    if (leader) {
      setWinnerArmy(leader.army);
      setMessage(`🏆 ${leader.name} completed the ${activeLength}-minute objective!`);
      setGamePhase("gameOver");
    }
  }, [gamePhase, gameState.territories, activeLength, players]);
  useEffect(() => {
    if (gamePhase !== "play") return;
    const timer = setTimeout(() => {
      const snapshot = { version: 2, savedAt: Date.now(), players, currentPlayerIndex, gameState, selectedTerritory, troopsToPlace, turnPhase, battleState, cardReward, playerCards, conqueredThisTurn, earnedCardThisTurn, message, gameLog, tradeCount, cardDeck, gameStats, activeLength, activeScenario, gameDeadline, timeRemaining, winnerArmy };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
        setHasSavedGame(true);
      } catch (_) {
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [gamePhase, players, currentPlayerIndex, gameState, selectedTerritory, troopsToPlace, turnPhase, battleState, cardReward, playerCards, conqueredThisTurn, earnedCardThisTurn, message, gameLog, tradeCount, cardDeck, gameStats, activeLength, activeScenario, gameDeadline, timeRemaining, winnerArmy]);
  const rollDice = () => {
    const currentAttackerTroops = battleState.attackerTroops;
    const currentDefenderTroops = battleState.defenderTroops;
    const attackerMax = Math.min(3, Math.max(0, currentAttackerTroops - 1));
    const defenderMax = Math.min(2, currentDefenderTroops);
    if (attackerMax <= 0) {
      setBattleState((prev) => ({
        ...prev,
        result: "Not enough troops to attack! (Need at least 2)",
        attackerDice: [],
        defenderDice: [],
        battlePhase: "resolved"
      }));
      return;
    }
    const attackerDice = Array.from({ length: attackerMax }, () => Math.floor(Math.random() * 6) + 1);
    const defenderDice = Array.from({ length: defenderMax }, () => Math.floor(Math.random() * 6) + 1);
    SoundSystem.diceRoll();
    const sortedAttacker = [...attackerDice].sort((a, b) => b - a);
    const sortedDefender = [...defenderDice].sort((a, b) => b - a);
    let attackerLosses = 0;
    let defenderLosses = 0;
    const comparisonResults = [];
    const pairCount = Math.min(sortedAttacker.length, sortedDefender.length);
    for (let i = 0; i < pairCount; i++) {
      if (sortedAttacker[i] > sortedDefender[i]) {
        defenderLosses++;
        comparisonResults.push("attacker");
      } else {
        attackerLosses++;
        comparisonResults.push("defender");
      }
    }
    const newAttackerTroops = currentAttackerTroops - attackerLosses;
    const newDefenderTroops = currentDefenderTroops - defenderLosses;
    let result = `Attacker lost ${attackerLosses}, Defender lost ${defenderLosses}!`;
    const isVictory = newDefenderTroops <= 0;
    if (isVictory) {
      result = "🎉 VICTORY! Territory conquered!";
    } else if (newAttackerTroops <= 1) {
      result = "😔 No more troops to attack with!";
    }
    setBattleState((prev) => ({
      ...prev,
      attackerDice,
      defenderDice,
      isRolling: true,
      battlePhase: "rolling",
      comparisons: null,
      pendingLosses: null,
      result: null
    }));
    setTimeout(() => {
      setBattleState((prev) => ({
        ...prev,
        isRolling: false,
        battlePhase: "comparing",
        comparisons: comparisonResults,
        pendingLosses: { attacker: attackerLosses, defender: defenderLosses }
      }));
    }, 600);
    setTimeout(() => {
      setBattleState((prev) => ({
        ...prev,
        attackerTroops: newAttackerTroops,
        defenderTroops: newDefenderTroops,
        battlePhase: "resolved",
        result,
        isVictory,
        troopsToMove: Math.max(1, newAttackerTroops - 1)
      }));
      if (!isVictory) {
        setGameState((prev) => {
          const newTerritories = { ...prev.territories };
          newTerritories[battleState.from] = {
            ...newTerritories[battleState.from],
            troops: newAttackerTroops
          };
          newTerritories[battleState.to] = {
            ...newTerritories[battleState.to],
            troops: newDefenderTroops
          };
          return { ...prev, territories: newTerritories };
        });
      }
    }, 1800);
  };
  const blitzAttack = () => {
    if (!battleState || battleState.isVictory) return;
    const runBlitz = async () => {
      let atkTroops = battleState.attackerTroops;
      let defTroops = battleState.defenderTroops;
      let totalAtkLosses = 0;
      let totalDefLosses = 0;
      let rounds = 0;
      let lastAtkDice = [];
      let lastDefDice = [];
      let lastComparisons = [];
      setBattleState((prev) => ({
        ...prev,
        isRolling: true,
        battlePhase: "rolling",
        result: "Blitz in progress..."
      }));
      while (atkTroops > 1 && defTroops > 0) {
        rounds++;
        const attackerMax = Math.min(3, atkTroops - 1);
        const defenderMax = Math.min(2, defTroops);
        const atkDice = Array.from({ length: attackerMax }, () => Math.floor(Math.random() * 6) + 1);
        const defDice = Array.from({ length: defenderMax }, () => Math.floor(Math.random() * 6) + 1);
        const sortedAtk = [...atkDice].sort((a, b) => b - a);
        const sortedDef = [...defDice].sort((a, b) => b - a);
        let atkLoss = 0;
        let defLoss = 0;
        const comps = [];
        const pairCount = Math.min(sortedAtk.length, sortedDef.length);
        for (let i = 0; i < pairCount; i++) {
          if (sortedAtk[i] > sortedDef[i]) {
            defLoss++;
            comps.push("attacker");
          } else {
            atkLoss++;
            comps.push("defender");
          }
        }
        atkTroops -= atkLoss;
        defTroops -= defLoss;
        totalAtkLosses += atkLoss;
        totalDefLosses += defLoss;
        lastAtkDice = atkDice;
        lastDefDice = defDice;
        lastComparisons = comps;
        await new Promise((r) => setTimeout(r, 50));
      }
      SoundSystem.diceRoll();
      const isVictory = defTroops <= 0;
      let result;
      if (isVictory) {
        result = `Blitz! ${rounds} rounds: You lost ${totalAtkLosses}, Defender lost ${totalDefLosses}. VICTORY!`;
      } else {
        result = `Blitz! ${rounds} rounds: You lost ${totalAtkLosses}, Defender lost ${totalDefLosses}. Out of troops!`;
      }
      setBattleState((prev) => ({
        ...prev,
        attackerTroops: atkTroops,
        defenderTroops: defTroops,
        attackerDice: lastAtkDice,
        defenderDice: lastDefDice,
        isRolling: false,
        battlePhase: "resolved",
        comparisons: lastComparisons,
        pendingLosses: null,
        result,
        isVictory,
        troopsToMove: isVictory ? Math.max(1, atkTroops - 1) : 1
      }));
      if (!isVictory) {
        setGameState((prev) => {
          const newTerritories = { ...prev.territories };
          newTerritories[battleState.from] = {
            ...newTerritories[battleState.from],
            troops: atkTroops
          };
          newTerritories[battleState.to] = {
            ...newTerritories[battleState.to],
            troops: defTroops
          };
          return { ...prev, territories: newTerritories };
        });
      }
    };
    runBlitz();
  };
  const claimTerritory = (troopsToMove) => {
    SoundSystem.conquest();
    const newAttackerTroops = battleState.attackerTroops;
    const defeatedArmy = gameState.territories[battleState.to]?.owner;
    triggerConquestRipple(battleState.to, ANIMAL_ARMIES[currentPlayer.army]?.color || "#fff");
    trackStat("territoriesConquered", currentPlayer.army);
    trackStat("battlesWon", currentPlayer.army);
    if (defeatedArmy) {
      trackStat("battlesLost", defeatedArmy);
    }
    const totalTroopsInBattle = battleState.attackerTroops + battleState.defenderTroops;
    setGameStats((prev) => {
      const prevBiggest = (prev.biggestBattle?.attackerTroops || 0) + (prev.biggestBattle?.defenderTroops || 0);
      if (totalTroopsInBattle > prevBiggest) {
        return {
          ...prev,
          biggestBattle: {
            attackerTroops: battleState.attackerTroops,
            defenderTroops: battleState.defenderTroops,
            from: TERRITORIES[battleState.from]?.name || battleState.from,
            to: TERRITORIES[battleState.to]?.name || battleState.to,
            winner: currentPlayer.name
          }
        };
      }
      return prev;
    });
    const newTerritories = { ...gameState.territories };
    newTerritories[battleState.from] = {
      ...newTerritories[battleState.from],
      troops: newAttackerTroops - troopsToMove
    };
    newTerritories[battleState.to] = {
      owner: currentPlayer.army,
      troops: troopsToMove
    };
    const defenderTerritories = Object.values(newTerritories).filter((t) => t.owner === defeatedArmy);
    let forceTrade = false;
    if (defenderTerritories.length === 0 && defeatedArmy) {
      const eliminatedCards = playerCards[defeatedArmy] || [];
      if (eliminatedCards.length > 0) {
        const myCurrentCards = playerCards[currentPlayer.army] || [];
        const newCardCount = myCurrentCards.length + eliminatedCards.length;
        setPlayerCards((prevCards) => ({
          ...prevCards,
          [currentPlayer.army]: [...prevCards[currentPlayer.army] || [], ...eliminatedCards],
          [defeatedArmy]: []
        }));
        if (newCardCount > 6) {
          forceTrade = true;
          setMessage(`🎉 Conquered! 💀 Eliminated player - took ${eliminatedCards.length} cards! Must trade down to 4 or fewer!`);
        } else {
          setMessage(`🎉 Conquered ${TERRITORIES[battleState.to].name}! 💀 Eliminated player - took ${eliminatedCards.length} cards!`);
        }
      } else {
        setMessage(`🎉 Conquered ${TERRITORIES[battleState.to].name}! 💀 Player eliminated!`);
      }
    } else {
      setMessage(`🎉 Conquered ${TERRITORIES[battleState.to].name}! Continue attacking from here or select another territory.`);
    }
    setGameState({ territories: newTerritories });
    setConqueredThisTurn(true);
    setBattleState(null);
    setSelectedTerritory(battleState.to);
    checkGameOver(newTerritories);
    if (forceTrade) {
      setMustTradeCards(true);
      setTimeout(() => setShowCardTrade(true), 300);
    }
  };
  const retreatBattle = () => {
    if (battleState && !battleState.isVictory) {
      trackStat("battlesLost", currentPlayer.army);
      const defArmy = gameState.territories[battleState.to]?.owner;
      if (defArmy) trackStat("battlesWon", defArmy);
    }
    setBattleState(null);
    setSelectedTerritory(null);
    setMessage("Select another territory to attack, or move to fortify phase.");
  };
  const checkGameOver = (newTerritories) => {
    const territories = newTerritories || gameState.territories;
    const owners = new Set(Object.values(territories).map((t) => t.owner));
    if (owners.size === 1) {
      setGamePhase("gameOver");
    }
    setPlayers((prev) => prev.map((p) => ({
      ...p,
      territories: Object.values(territories).filter((t) => t.owner === p.army).length
    })));
  };
  const endPhase = () => {
    setSelectedTerritory(null);
    if (turnPhase === "attack") {
      if (conqueredThisTurn && !earnedCardThisTurn) {
        const newCard = drawCard();
        setCardReward(newCard);
        setPlayerCards((prev) => ({
          ...prev,
          [currentPlayer.army]: [...prev[currentPlayer.army] || [], newCard]
        }));
        setEarnedCardThisTurn(true);
      }
      const canMove = Object.entries(gameState.territories).some(
        ([id, t]) => t.owner === currentPlayer.army && t.troops > 1
      );
      if (canMove) {
        setTurnPhase("fortify");
        setMessage("Fortify phase (optional)! Move animals between territories, or just end your turn.");
      } else {
        goToNextPlayer();
      }
    } else if (turnPhase === "fortify") {
      goToNextPlayer();
    }
  };
  const endTurn = () => {
    setSelectedTerritory(null);
    if (conqueredThisTurn && !earnedCardThisTurn) {
      const newCard = drawCard();
      setCardReward(newCard);
      setPlayerCards((prev) => ({
        ...prev,
        [currentPlayer.army]: [...prev[currentPlayer.army] || [], newCard]
      }));
      setEarnedCardThisTurn(true);
    }
    goToNextPlayer();
  };
  const goToNextPlayer = () => {
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    let attempts = 0;
    let idx = nextIndex;
    while (attempts < players.length) {
      const playerArmy = players[idx].army;
      const hasTerritories = Object.values(gameState.territories).some((t) => t.owner === playerArmy);
      if (hasTerritories) break;
      idx = (idx + 1) % players.length;
      attempts++;
    }
    setCurrentPlayerIndex(idx);
    setConqueredThisTurn(false);
    setEarnedCardThisTurn(false);
    const nextPlayer = players[idx];
    const newTroops = calculateReinforcements(nextPlayer, gameState.territories);
    setTroopsToPlace(newTroops);
    setTurnPhase("reinforce");
    const nextPlayerCards = playerCards[nextPlayer.army] || [];
    if (nextPlayerCards.length >= 5 && canTradeCards(nextPlayerCards) && !nextPlayer.isAI) {
      setMessage(`Your turn! You have ${nextPlayerCards.length} cards - you MUST trade first!`);
      setMustTradeCards(true);
      setShowCardTrade(true);
    } else if (nextPlayer.isAI) {
      setMessage(`🤖 ${nextPlayer.name} is taking their turn...`);
    } else {
      setMessage(`Your turn, ${nextPlayer.name}! Place your ${newTroops} animals.`);
    }
  };
  useEffect(() => {
    if (gamePhase === "gameOver") {
      try {
        localStorage.removeItem(SAVE_KEY);
        setHasSavedGame(false);
      } catch (_) {
      }
      const winner = players.find((p) => p.army === winnerArmy) || [...players].sort(
        (a, b) => Object.values(gameState.territories).filter((t) => t.owner === b.army).length - Object.values(gameState.territories).filter((t) => t.owner === a.army).length
      )[0];
      if (winner && !winner.isAI) SoundSystem.victory();
      else SoundSystem.gameOver();
    }
  }, [gamePhase, winnerArmy]);
  const [setupHumans, setSetupHumans] = useState(1);
  const [setupAIs, setSetupAIs] = useState(1);
  const [humanArmyChoices, setHumanArmyChoices] = useState({});
  const resumeSavedGame = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!saved?.players || !saved?.gameState?.territories) return;
      setPlayers(saved.players);
      setCurrentPlayerIndex(saved.currentPlayerIndex || 0);
      setGameState(saved.gameState);
      setSelectedTerritory(saved.selectedTerritory || null);
      setTroopsToPlace(saved.troopsToPlace || 0);
      setTurnPhase(saved.turnPhase || "reinforce");
      setBattleState(saved.battleState || null);
      setCardReward(saved.cardReward || null);
      setPlayerCards(saved.playerCards || {});
      setConqueredThisTurn(Boolean(saved.conqueredThisTurn));
      setEarnedCardThisTurn(Boolean(saved.earnedCardThisTurn));
      setMessageRaw(saved.message || "Game resumed!");
      setGameLog([...saved.gameLog || [], { text: "Game resumed from autosave.", time: Date.now() }]);
      setTradeCount(saved.tradeCount || 0);
      setCardDeck(saved.cardDeck?.length ? saved.cardDeck : shuffleArray(CARD_DECK));
      setGameStats(saved.gameStats || gameStats);
      setActiveLength(saved.activeLength || "30");
      setActiveScenario(saved.activeScenario || "open");
      const restoredDeadline = Date.now() + Math.max(1, saved.timeRemaining || 1800) * 1e3;
      setGameDeadline(restoredDeadline);
      setTimeRemaining(Math.max(1, saved.timeRemaining || 1800));
      setWinnerArmy(saved.winnerArmy || null);
      setGamePhase("play");
    } catch (_) {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (_2) {
      }
      setHasSavedGame(false);
    }
  };
  if (gamePhase === "setup") {
    const aiNames = ["Captain Claw", "Baron Beak", "Duke Fang", "Lady Paw", "Sir Scales"];
    const armyList = Object.entries(ANIMAL_ARMIES);
    const totalPlayers = setupHumans + setupAIs;
    const maxPlayers = 6;
    const minTotal = 2;
    const canAddHuman = totalPlayers < maxPlayers;
    const canRemoveHuman = setupHumans > 0 && totalPlayers > minTotal;
    const canAddAI = totalPlayers < maxPlayers;
    const canRemoveAI = setupAIs > 0 && totalPlayers > minTotal;
    return /* @__PURE__ */ React.createElement("div", { className: "zoo-setup min-h-screen flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "zoo-setup-card bg-white/90 backdrop-blur rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl" }, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl mb-2 game-title text-amber-800" }, "🦁 Zoo Conquest 🐘"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-6" }, "A Risk-style adventure at the Kansas City Zoo!"), hasSavedGame && /* @__PURE__ */ React.createElement("button", { onClick: resumeSavedGame, className: "w-full mb-4 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg" }, "▶ Resume Saved Game"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 mb-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-green-800 mb-2" }, "⏱ Rule Set"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, ["15", "30", "60"].map((minutes) => /* @__PURE__ */ React.createElement("button", { key: minutes, onClick: () => setSetupLength(minutes), className: `flex-1 py-2 rounded-lg text-xs font-bold ${setupLength === minutes ? "bg-green-600 text-white" : "bg-white text-gray-700 border border-green-200"}` }, minutes, "m"))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-2" }, setupLength === "15" ? "Sprint: gain 5 zones" : setupLength === "30" ? "Classic: gain 10 zones" : "Epic: conquer the zoo")), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-purple-800 mb-2" }, "🗺 Scenario"), /* @__PURE__ */ React.createElement("select", { value: setupScenario, onChange: (event) => setSetupScenario(event.target.value), className: "w-full p-2 rounded-lg border border-purple-200 text-sm text-gray-800" }, /* @__PURE__ */ React.createElement("option", { value: "open" }, "Open Zoo"), /* @__PURE__ */ React.createElement("option", { value: "regions" }, "Region Rush"), /* @__PURE__ */ React.createElement("option", { value: "laststand" }, "Last Stand")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-2" }, setupScenario === "regions" ? "Armies begin in region clusters" : setupScenario === "laststand" ? "Fortified opening positions" : "Classic shuffled territory map"))), /* @__PURE__ */ React.createElement("div", { className: "mb-6 bg-gray-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-gray-800 mb-4" }, "Choose Your Players"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4 bg-white rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "👤"), /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800" }, "Human Players"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "Pass & play with friends"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canRemoveHuman && setSetupHumans((h) => h - 1),
        disabled: !canRemoveHuman,
        "aria-label": "Remove human player",
        className: "w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      },
      "-"
    ), /* @__PURE__ */ React.createElement("span", { className: "w-8 text-center text-xl font-bold text-gray-800" }, setupHumans), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canAddHuman && setSetupHumans((h) => h + 1),
        disabled: !canAddHuman,
        "aria-label": "Add human player",
        className: "w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      },
      "+"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between bg-white rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-2xl" }, "🤖"), /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800" }, "AI Opponents"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "Computer-controlled"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canRemoveAI && setSetupAIs((a) => a - 1),
        disabled: !canRemoveAI,
        "aria-label": "Remove AI opponent",
        className: "w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      },
      "-"
    ), /* @__PURE__ */ React.createElement("span", { className: "w-8 text-center text-xl font-bold text-gray-800" }, setupAIs), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canAddAI && setSetupAIs((a) => a + 1),
        disabled: !canAddAI,
        "aria-label": "Add AI opponent",
        className: "w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      },
      "+"
    ))), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-500 mt-3" }, "Total: ", totalPlayers, " players (min 2, max 6)")), setupHumans > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-amber-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-amber-800 mb-3" }, "Choose Your Animal Army"), Array.from({ length: setupHumans }).map((_, playerIdx) => {
      const selectedArmy = humanArmyChoices[playerIdx];
      const takenByOthers = Object.entries(humanArmyChoices).filter(([idx]) => parseInt(idx) !== playerIdx).map(([, army]) => army);
      return /* @__PURE__ */ React.createElement("div", { key: playerIdx, className: "mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-gray-600 mb-1" }, setupHumans === 1 ? "Your Army:" : `Player ${playerIdx + 1}:`), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 justify-center" }, armyList.map(([key, army]) => {
        const isTaken = takenByOthers.includes(key);
        const isSelected = selectedArmy === key;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key,
            "data-army": key,
            "aria-label": `Choose ${army.name} army for player ${playerIdx + 1}`,
            disabled: isTaken,
            onClick: () => {
              setHumanArmyChoices((prev) => {
                const next = { ...prev };
                if (isSelected) {
                  delete next[playerIdx];
                } else {
                  next[playerIdx] = key;
                }
                return next;
              });
            },
            className: `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${isSelected ? "border-yellow-400 ring-2 ring-yellow-300 scale-105" : isTaken ? "border-gray-200 opacity-30 cursor-not-allowed" : "border-gray-200 hover:border-gray-400 hover:scale-105 cursor-pointer"}`,
            style: isSelected ? { backgroundColor: army.color + "33", borderColor: army.color } : {}
          },
          /* @__PURE__ */ React.createElement("span", { className: "text-lg" }, army.emoji),
          /* @__PURE__ */ React.createElement("span", { className: "text-gray-700" }, army.name)
        );
      })));
    }), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400 text-center mt-1" }, "Leave unselected for random assignment")), /* @__PURE__ */ React.createElement("div", { className: "zoo-player-preview bg-amber-50 rounded-xl p-3 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-amber-800 mb-2" }, "Players in this game:"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap justify-center gap-2" }, (() => {
      const usedSet = /* @__PURE__ */ new Set();
      const humanPreviews = [];
      for (let i = 0; i < setupHumans; i++) {
        const chosen = humanArmyChoices[i];
        if (chosen) {
          humanPreviews.push({ key: chosen, army: ANIMAL_ARMIES[chosen], isHuman: true, name: setupHumans === 1 ? "You" : `Player ${i + 1}` });
          usedSet.add(chosen);
        } else {
          humanPreviews.push({ key: null, army: null, isHuman: true, name: setupHumans === 1 ? "You" : `Player ${i + 1}` });
        }
      }
      const remaining = armyList.filter(([k]) => !usedSet.has(k));
      let remIdx = 0;
      humanPreviews.forEach((hp) => {
        if (!hp.key && remaining[remIdx]) {
          hp.key = remaining[remIdx][0];
          hp.army = remaining[remIdx][1];
          usedSet.add(hp.key);
          remIdx++;
        }
      });
      const aiPreviews = [];
      const aiRemaining = armyList.filter(([k]) => !usedSet.has(k));
      for (let i = 0; i < setupAIs && i < aiRemaining.length; i++) {
        aiPreviews.push({ key: aiRemaining[i][0], army: aiRemaining[i][1], isHuman: false, name: aiNames[i] });
      }
      return [...humanPreviews, ...aiPreviews].map((p) => /* @__PURE__ */ React.createElement("div", { key: p.key || p.name, className: `flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${p.isHuman ? "bg-green-100" : "bg-blue-100"}` }, /* @__PURE__ */ React.createElement("span", null, p.army?.emoji || "?"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-700" }, p.name), /* @__PURE__ */ React.createElement("span", { className: "text-xs" }, p.isHuman ? "👤" : "🤖")));
    })())), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => startGame(setupHumans, setupAIs),
        className: "w-full mb-4 px-6 py-4 bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xl font-bold rounded-xl shadow-lg transition-all hover:scale-105"
      },
      "🎮 Start Game!"
    ), /* @__PURE__ */ React.createElement("details", { className: "zoo-help" }, /* @__PURE__ */ React.createElement("summary", null, "How to Play & Dice Rules"), /* @__PURE__ */ React.createElement("div", { className: "text-left bg-gray-50 rounded-xl p-4" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800 mb-2" }, "🎮 How to Play:"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-gray-700 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, "🎯 Conquer all zoo zones to win!"), /* @__PURE__ */ React.createElement("li", null, "🏠 1 animal must always stay behind to guard!"), /* @__PURE__ */ React.createElement("li", null, "🎲 Roll 1 die per attacking animal (max 3)"), /* @__PURE__ */ React.createElement("li", null, "🛡️ Defenders roll up to 2 dice"), /* @__PURE__ */ React.createElement("li", null, "🃏 Earn fun cards by conquering territories"))), /* @__PURE__ */ React.createElement("div", { className: "text-left bg-blue-50 rounded-xl p-4 mt-3" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-blue-800 mb-2" }, "🎲 Dice Rules:"), /* @__PURE__ */ React.createElement("ul", { className: "text-xs text-gray-700 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, "• 2 animals = 1 attack die (1 stays home)"), /* @__PURE__ */ React.createElement("li", null, "• 3 animals = 2 attack dice"), /* @__PURE__ */ React.createElement("li", null, "• 4+ animals = 3 attack dice (max)"), /* @__PURE__ */ React.createElement("li", null, "• Highest dice compare - ties go to defender!")))), /* @__PURE__ */ React.createElement("details", { className: "mt-4 bg-purple-50 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("summary", { className: "font-bold text-purple-800 cursor-pointer hover:text-purple-600 flex items-center justify-center gap-2" }, "📱 Share Game (QR Code)"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex flex-col items-center" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`,
        alt: "QR Code to share game",
        className: "rounded-lg shadow-md"
      }
    ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-2" }, "Scan to play on another device!"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          navigator.clipboard.writeText(window.location.href).then(() => {
            const btn = e.target;
            const orig = btn.textContent;
            btn.textContent = "✅ Copied!";
            setTimeout(() => {
              btn.textContent = orig;
            }, 2e3);
          });
        },
        className: "mt-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg"
      },
      "📋 Copy Link"
    )))));
  }
  if (gamePhase === "gameOver") {
    const winner = players.find((p) => p.army === winnerArmy) || [...players].sort((a, b) => Object.values(gameState.territories).filter((t) => t.owner === b.army).length - Object.values(gameState.territories).filter((t) => t.owner === a.army).length)[0];
    const playerWon = winner && !winner.isAI;
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { "aria-live": "assertive", role: "alert", className: "bg-white/90 backdrop-blur rounded-3xl p-8 max-w-2xl w-full text-center shadow-2xl max-h-[95vh] overflow-y-auto" }, playerWon ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl mb-4 game-title text-amber-800" }, "🏆 YOU WON! 🏆"), /* @__PURE__ */ React.createElement("div", { className: "text-6xl mb-4" }, ANIMAL_ARMIES[winner.army].emoji), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-gray-800 mb-2" }, "Congratulations!"), /* @__PURE__ */ React.createElement("div", { className: "text-lg text-gray-600 mb-4" }, "Your ", ANIMAL_ARMIES[winner.army].name, " completed the ", activeLength, "-minute ", activeScenario === "open" ? "Open Zoo" : activeScenario === "regions" ? "Region Rush" : "Last Stand", " objective!")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { className: "text-4xl mb-4 game-title text-red-800" }, "😢 GAME OVER 😢"), /* @__PURE__ */ React.createElement("div", { className: "text-6xl mb-4" }, ANIMAL_ARMIES[winner?.army]?.emoji || "🤖"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-gray-800 mb-2" }, winner?.name || "AI", " Wins!"), /* @__PURE__ */ React.createElement("div", { className: "text-lg text-gray-600 mb-4" }, "The ", ANIMAL_ARMIES[winner?.army]?.name || "enemies", " have taken over the zoo!")), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-100 rounded-xl p-4 mb-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800 text-center mb-3" }, "Game Statistics"), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-xs" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "text-gray-500 border-b border-gray-300" }, /* @__PURE__ */ React.createElement("th", { className: "text-left py-1 px-1" }, "Player"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-1 px-1" }, "Conquered"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-1 px-1" }, "Won"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-1 px-1" }, "Lost"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-1 px-1" }, "Cards"), /* @__PURE__ */ React.createElement("th", { className: "text-center py-1 px-1" }, "Deployed"))), /* @__PURE__ */ React.createElement("tbody", null, players.map((p) => /* @__PURE__ */ React.createElement("tr", { key: p.id, className: "border-b border-gray-200" }, /* @__PURE__ */ React.createElement("td", { className: "py-1.5 px-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, ANIMAL_ARMIES[p.army]?.emoji), /* @__PURE__ */ React.createElement("span", { className: "ml-1 font-bold text-gray-700" }, p.name)), /* @__PURE__ */ React.createElement("td", { className: "text-center font-bold text-gray-700" }, gameStats.territoriesConquered[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center font-bold text-green-600" }, gameStats.battlesWon[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center font-bold text-red-600" }, gameStats.battlesLost[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center font-bold text-amber-600" }, gameStats.cardsTraded[p.army] || 0), /* @__PURE__ */ React.createElement("td", { className: "text-center font-bold text-blue-600" }, gameStats.troopsDeployed[p.army] || 0)))))), gameStats.biggestBattle && gameStats.biggestBattle.attackerTroops > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-center text-xs text-gray-600" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Biggest Battle:"), " ", gameStats.biggestBattle.from, " vs ", gameStats.biggestBattle.to, "(", gameStats.biggestBattle.attackerTroops, " vs ", gameStats.biggestBattle.defenderTroops, ")", gameStats.biggestBattle.winner && ` - ${gameStats.biggestBattle.winner}`)), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setGamePhase("setup"),
        "aria-label": "Play again",
        className: "px-8 py-4 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-xl font-bold rounded-xl shadow-lg transition-all hover:scale-105"
      },
      "🔄 Play Again!"
    )));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "zoo-game h-screen flex overflow-hidden bg-gray-900" }, /* @__PURE__ */ React.createElement("div", { className: "game-map-area flex-1 p-3 flex flex-col min-w-0" }, /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", role: "status", className: `game-message-bar rounded-lg px-4 py-2 mb-2 text-center ${currentPlayer?.isAI ? "bg-blue-600" : "bg-gray-800"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold text-sm" }, currentPlayer?.isAI && "🤖 ", message), /* @__PURE__ */ React.createElement("span", { className: "ml-3 text-xs text-white/80" }, "⏱ ", Math.floor(timeRemaining / 60), ":", String(timeRemaining % 60).padStart(2, "0"), " · ", activeScenario === "open" ? "Open Zoo" : activeScenario === "regions" ? "Region Rush" : "Last Stand", " ", currentPlayer?.personality ? `· ${currentPlayer.personality} AI` : "")), /* @__PURE__ */ React.createElement("div", { className: "mobile-phase-bar mb-2 flex gap-1 items-center md:hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-0.5 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1 rounded font-bold text-xs ${turnPhase === "reinforce" ? "bg-green-500 text-white" : "bg-gray-700 text-gray-500"}` }, "Place", troopsToPlace > 0 && ` (${troopsToPlace})`), /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1 rounded font-bold text-xs ${turnPhase === "attack" ? "bg-red-500 text-white" : "bg-gray-700 text-gray-500"}` }, "Attack"), /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1 rounded font-bold text-xs ${turnPhase === "fortify" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-500"}` }, "Fortify")), turnPhase === "attack" && !currentPlayer?.isAI && /* @__PURE__ */ React.createElement("button", { onClick: endTurn, className: "py-1 px-2 bg-green-500 text-white font-bold rounded text-xs whitespace-nowrap" }, "End Turn"), turnPhase === "fortify" && !currentPlayer?.isAI && /* @__PURE__ */ React.createElement("button", { onClick: endPhase, className: "py-1 px-2 bg-green-500 text-white font-bold rounded text-xs whitespace-nowrap" }, "End Turn")), /* @__PURE__ */ React.createElement("div", { className: "territory-readout", role: "status", "aria-live": "polite" }, /* @__PURE__ */ React.createElement("span", null, "Territory"), /* @__PURE__ */ React.createElement("strong", null, TERRITORIES[inspectedTerritory || selectedTerritory]?.name || "Tap a territory to see its full name")), /* @__PURE__ */ React.createElement("div", { className: "zoo-map-frame flex-1 bg-gray-800 rounded-xl overflow-hidden" }, /* @__PURE__ */ React.createElement(
    GameMap,
    {
      gameState,
      selectedTerritory,
      validTargets: turnPhase === "attack" ? getValidTargets() : getValidFortifyTargets(),
      onTerritoryClick: handleTerritoryClick,
      turnPhase,
      onTerritoryHover: handleTerritoryHover,
      onTerritoryHoverEnd: handleTerritoryHoverEnd,
      rippleEffects
    }
  ))), showMobileSidebar && /* @__PURE__ */ React.createElement("div", { className: "sidebar-backdrop", onClick: () => setShowMobileSidebar(false) }), /* @__PURE__ */ React.createElement("button", { className: "mobile-toggle-btn", onClick: () => setShowMobileSidebar((s) => !s), "aria-label": "Toggle info panel" }, showMobileSidebar ? "✕" : "📋"), /* @__PURE__ */ React.createElement("div", { className: `game-sidebar w-72 bg-gray-800 p-3 flex flex-col gap-3 overflow-y-auto border-l-2 border-gray-700 ${showMobileSidebar ? "open" : ""}` }, /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", className: "rounded-lg p-3", style: { backgroundColor: currentArmy?.color + "33", borderLeft: `4px solid ${currentArmy?.color}` } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-3xl", "aria-hidden": "true" }, currentArmy?.emoji), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-white font-bold" }, currentPlayer?.name), /* @__PURE__ */ React.createElement("div", { className: "text-gray-300 text-sm" }, currentPlayer?.territories, " zones • ", getPlayerTroops(currentPlayer?.army), " animals"))), playerCards[currentPlayer?.army]?.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-yellow-400 text-sm" }, "🃏 ", playerCards[currentPlayer?.army]?.length, " cards", turnPhase === "reinforce" && canCurrentPlayerTrade() && !currentPlayer?.isAI && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowCardTrade(true), className: "ml-2 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded" }, "Trade"))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 mb-3" }, /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1.5 rounded font-bold text-xs ${turnPhase === "reinforce" ? "bg-green-500 text-white" : "bg-gray-600 text-gray-400"}` }, "Place ", troopsToPlace > 0 && `(${troopsToPlace})`), /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1.5 rounded font-bold text-xs ${turnPhase === "attack" ? "bg-red-500 text-white" : "bg-gray-600 text-gray-400"}` }, "Attack"), /* @__PURE__ */ React.createElement("div", { className: `flex-1 text-center py-1.5 rounded font-bold text-xs ${turnPhase === "fortify" ? "bg-blue-500 text-white" : "bg-gray-600 text-gray-400"}` }, "Fortify")), turnPhase === "reinforce" && !currentPlayer?.isAI && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, canCurrentPlayerTrade() && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowCardTrade(true),
      className: "w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold rounded-lg shadow-lg ring-2 ring-yellow-300 ring-offset-2 ring-offset-gray-700"
    },
    "🃏 Trade Cards for +",
    getNextTradeValue(),
    " Animals!"
  ), troopsToPlace > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-center text-yellow-400 font-bold text-sm" }, "Click to place ", troopsToPlace, " animals"), /* @__PURE__ */ React.createElement("div", { className: "text-center text-gray-300 text-xs" }, "ontouchstart" in window ? "Double-tap to place ALL" : "Double-click or Shift+click to place ALL"))), turnPhase === "attack" && !currentPlayer?.isAI && (() => {
    const canMove = Object.entries(gameState.territories).some(
      ([id, t]) => t.owner === currentPlayer.army && t.troops > 1
    );
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("button", { onClick: endTurn, className: "w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg" }, "✅ End Turn"), canMove && /* @__PURE__ */ React.createElement("button", { onClick: endPhase, className: "w-full py-1.5 bg-blue-500/80 hover:bg-blue-600 text-white rounded text-sm" }, "Fortify →"));
  })(), turnPhase === "fortify" && !currentPlayer?.isAI && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-gray-300 text-xs text-center" }, "Optional: move animals"), /* @__PURE__ */ React.createElement("button", { onClick: endPhase, className: "w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg" }, "✅ End Turn"))), !currentPlayer?.isAI && playerCards[currentPlayer?.army]?.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-3 border border-amber-600" }, /* @__PURE__ */ React.createElement("div", { className: "text-amber-100 font-bold text-sm mb-2" }, "🃏 Your Cards (", playerCards[currentPlayer?.army]?.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 mb-2" }, playerCards[currentPlayer?.army]?.map((card, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: `px-2 py-1 rounded text-xs font-bold text-white ${card.type === "infantry" ? "bg-green-600" : card.type === "cavalry" ? "bg-blue-600" : card.type === "artillery" ? "bg-red-600" : "bg-yellow-500 text-black"}` }, card.type === "infantry" ? "🐾" : card.type === "cavalry" ? "🦓" : card.type === "artillery" ? "🐘" : "🌟"))), /* @__PURE__ */ React.createElement("div", { className: "text-amber-200 text-xs" }, "Trade 3 matching OR 1 of each type"), canCurrentPlayerTrade() && turnPhase === "reinforce" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowCardTrade(true),
      className: "w-full mt-2 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-sm"
    },
    "Trade for +",
    getNextTradeValue(),
    " 🐾"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-white font-bold text-sm mb-2" }, "All Players"), players.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: `flex items-center gap-2 py-1.5 px-2 rounded mb-1 ${i === currentPlayerIndex ? "bg-gray-600" : "bg-gray-800"}` }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, ANIMAL_ARMIES[p.army].emoji), /* @__PURE__ */ React.createElement("span", { className: "text-white flex-1 text-sm" }, p.name), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 text-sm" }, p.territories), p.isAI && /* @__PURE__ */ React.createElement("span", { className: "text-blue-400 text-xs" }, "🤖"), playerCards[p.army]?.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-yellow-400 text-xs" }, "🃏", playerCards[p.army].length)))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-white font-bold text-sm mb-2" }, "Regions"), Object.entries(REGIONS).map(([name, region]) => /* @__PURE__ */ React.createElement("div", { key: name, className: "flex items-center gap-2 py-0.5 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-3 rounded", style: { backgroundColor: region.color } }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 flex-1" }, region.emoji, " ", REGION_DISPLAY_NAMES[name]), /* @__PURE__ */ React.createElement("span", { className: "text-green-400 font-bold" }, "+", region.bonus)))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 rounded-lg p-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-white font-bold text-sm mb-2" }, "Game Log"), /* @__PURE__ */ React.createElement("div", { className: "game-log-panel", ref: gameLogRef }, gameLog.map((entry, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "game-log-entry text-gray-300" }, entry.text)))), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-700 rounded-lg p-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setAiSpeedFast((prev) => !prev),
      className: `w-full py-1.5 rounded-lg text-xs font-bold transition-all ${aiSpeedFast ? "bg-yellow-500 hover:bg-yellow-400 text-black" : "bg-gray-600 hover:bg-gray-500 text-gray-300"}`,
      "aria-label": aiSpeedFast ? "Slow down AI turns" : "Speed up AI turns"
    },
    aiSpeedFast ? "⚡ AI Speed: FAST" : "🐢 AI Speed: Normal"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mt-auto" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const m = SoundSystem.toggleMute();
        setSoundMuted(m);
      },
      className: `flex-1 py-2 rounded-lg text-sm font-bold ${soundMuted ? "bg-red-600 hover:bg-red-500 text-white" : "bg-gray-600 hover:bg-gray-500 text-gray-300"}`,
      "aria-label": soundMuted ? "Unmute sounds" : "Mute sounds"
    },
    soundMuted ? "🔇 Muted" : "🔊 Sound"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowStats(true),
      className: "flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm font-bold",
      "aria-label": "View game statistics"
    },
    "📊 Stats"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (confirm("Return to setup? Current game will be lost.")) setGamePhase("setup");
      },
      className: "flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm font-bold",
      "aria-label": "Return to game setup menu"
    },
    "🏠 Menu"
  ))), battleState && /* @__PURE__ */ React.createElement(
    BattleModal,
    {
      attacker: { army: currentPlayer.army, troops: battleState.attackerTroops },
      defender: { army: gameState.territories[battleState.to]?.owner || currentPlayer.army, troops: battleState.defenderTroops },
      attackingFrom: battleState.from,
      defendingTo: battleState.to,
      onRoll: rollDice,
      onBlitz: blitzAttack,
      onRetreat: retreatBattle,
      onClaimTerritory: claimTerritory,
      battleResult: battleState.result,
      attackerDice: battleState.attackerDice,
      defenderDice: battleState.defenderDice,
      isRolling: battleState.isRolling,
      isVictory: battleState.isVictory,
      troopsToMove: battleState.troopsToMove,
      setTroopsToMove: (val) => setBattleState((prev) => ({ ...prev, troopsToMove: val })),
      battlePhase: battleState.battlePhase,
      comparisons: battleState.comparisons,
      pendingLosses: battleState.pendingLosses
    }
  ), cardReward && /* @__PURE__ */ React.createElement(
    CardRewardModal,
    {
      card: cardReward,
      onClose: () => setCardReward(null)
    }
  ), showCardTrade && currentPlayer && /* @__PURE__ */ React.createElement(
    CardTradeModal,
    {
      cards: playerCards[currentPlayer.army] || [],
      onTrade: handleCardTrade,
      onCancel: () => {
        setShowCardTrade(false);
        setMustTradeCards(false);
      },
      tradeCount,
      nextTradeValue: getNextTradeValue(),
      mustTrade: mustTradeCards
    }
  ), showStats && /* @__PURE__ */ React.createElement(
    StatsPanel,
    {
      players,
      gameStats,
      onClose: () => setShowStats(false)
    }
  ), /* @__PURE__ */ React.createElement(TerritoryTooltip, { info: tooltipInfo }));
};
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(ZooRiskGame, null)));
