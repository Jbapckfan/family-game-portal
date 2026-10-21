# HEX MIND: Game Blueprints

## Overview
Six daily games targeting different cognitive domains: Linguistics, Logic, Action/Reaction, Memory, Pattern Recognition, and Strategy.

---

## 1. QUADRA (Linguistic Deduction)
**Status:** Prototype Complete (`QUADRA.html`)
**Concept:** 16 letters, 4 hidden words, 1 category.
**Hook:** Combines Wordle's brevity with Connections' semantic grouping.
**Mechanics:**
- Grid of 16 shuffled letters from 4 target words.
- Player forms 4-letter words matching the daily category.
- Correct words lock tiles. Incorrect guesses cost lives (max 4).
- Win by finding all 4 words.

---

## 2. LOGIC LATTICE (Deductive Reasoning)
**Concept:** Sudoku meets Nonogram via logical statements.
**Hook:** Pure deduction without language barriers. High flow state potential.
**Mechanics:**
- 5x5 or 6x6 binary grid (Black/White cells).
- Clues are logical propositions (e.g., "Row 2 has 3 Black cells," "No diagonal touches").
- Player toggles cells to satisfy all clues simultaneously.
- Limited undos create tension.
**Difficulty Scaling:** From simple counting to complex relational logic.

---

## 3. SYNTAX SIEGE (Action-Lexical)
**Concept:** Anagrams meet Tower Defense.
**Hook:** Adrenaline-driven word formation. Tests speed and vocabulary under pressure.
**Mechanics:**
- Central Core with HP. Enemies approach carrying letters.
- Letters enter player's "Hand" when enemies reach a threshold.
- Form valid English words to damage/destroy enemies.
- Longer words = more damage. Specific categories (verbs/nouns) have effects.
- Letters expire quickly (10s), forcing rapid recall.
**Daily Twist:** Modifiers change rules (e.g., "Only 4-letter words," "Vowels worth double").

---

## 4. MEMORY MAZE (Visuospatial Working Memory)
**Concept:** Navigate a memorized path.
**Hook:** Direct training of spatial memory. Zen-like focus.
**Mechanics:**
- Phase 1: A glowing path appears on a 7x7 grid for 5-8 seconds.
- Phase 2: Path vanishes. Obstacles appear.
- Player taps cells to retrace the exact original path.
- Errors cause red flashes/time penalties.
**Twist:** Moving targets in advanced levels require dynamic updating.

---

## 5. PATTERN PRISM (Inductive Reasoning)
**Concept:** Sequence prediction (Raven's Matrices style).
**Hook:** IQ-test feel. Visual satisfaction. Fluid intelligence training.
**Mechanics:**
- Animated sequence of shapes/colors/sizes.
- Identify the underlying rule (rotation, color shift, progression).
- Predict the next 3 elements from multiple choices.
- "Glitch" mode: Find the outlier that breaks the rule.
**Complexity:** Multi-dimensional attributes (shape + color + position + rotation).

---

## 6. TERRITORY TACTICS (Strategic Planning)
**Concept:** Lightweight Go/Risk hybrid.
**Hook:** Long-term thinking and spatial control.
**Mechanics:**
- Hexagonal grid board.
- Place stones to surround opponent territory.
- Captured stones removed.
- Daily Puzzle: Specific board states requiring optimal moves (e.g., "Capture 3 stones in 2 moves").
**AI:** Adaptive difficulty based on win rate.
