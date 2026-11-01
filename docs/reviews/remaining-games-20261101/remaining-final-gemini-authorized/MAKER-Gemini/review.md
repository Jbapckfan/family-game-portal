### Static Code Review

**Scope of Review:** Static audit of supplied logic modules across Claude games (`claude-tangle`, `claude-tumbler`, `claude-dovetail`, `claude-splice`, `claude-sprout`, `claude-keystone`), `deepseek-rung`, Kimi Pebbles (`tangle`, `quartet`), and audit scripts. This analysis is strictly static; no runtime execution, browser/device rendering, or editorial dictionary certification was performed.

---

### Finding Summary

**No concrete defects identified.** The concrete logic across all provided modules adheres to the specified architectural contracts and edge-case requirements.

---

### Key Subsystem Analysis

#### 1. Claude Tangle (`engine.mjs` & `word-acceptance.mjs`)
- **Free Retries vs. Trap Knots:** In `submit()`, when a selected word does not match the active partition (`target === undefined`) but is in the dictionary, `findWordPaths(p.s, word)` searches remaining beads for an alternate viable path. If any viable path exists, `submit()` returns early with `{state: s}` (retaining selected beads, zero knots charged). True traps fall through to append a `'knot'` event.
- **Replay & Invariant Preservation:** `replay()` evaluates events against path viability without retroactively blocking historical knot events, ensuring past saves replay faithfully.
- **Partition Exact Cover:** `wordPartition()` recursively partitions remaining beads using bitmasks (`mask ^ first`) and lowest-bit pruning (`first & lowest`), memoizing failed states via sorted remaining lengths to guarantee deterministic partition detection.

#### 2. Kimi Tangle (`engine.ts`, `lexicon.ts`, `progress.ts`)
- **Markerless Save Inference:** `dailyTangle()` cleanly differentiates legacy saves: missing `vocabulary` markers infer edition `2` for days $\ge 20757$ and `1` prior.
- **Legacy Exclusion Retention:** If a restored legacy save contains a word from `TANGLE_REVIEWED_EXCLUSIONS`, `dailyTangle()` preserves `legacyBase` so earned scores and valid completions are never invalidated.
- **Edition Freezing & Targets:** `expandTanglePuzzle()` immutably expands word lists against frozen v2 or v3 lexicons while preserving authored medal thresholds (`targets: [...puzzle.targets]`). Unsupported vocabulary versions are safely trapped via `unsupportedTangleVocabulary()`.

#### 3. Claude Game Contracts & Assistance Shorthand
- **Assistance Contracts:** All six Claude games (`claude-dovetail`, `claude-splice`, `claude-sprout`, `claude-tangle`, `claude-keystone`, `claude-tumbler`) properly supply `assistanceCount` via ES object property shorthand to `mountDailyGame()`.
- **Tumbler Additive Lexicon:** `claude-tumbler` expands valid guess words via `WORD_GAME_GUESSES` into `WORDS` additively without altering secret answer sets, dial feedback arithmetic, or `restoreState()` constraints. Version splitting is deliberately and correctly avoided.

#### 4. DeepSeek Rung (`engine.mjs`)
- **BFS Route Determinism:** Lexicon neighbor lists prioritize `ORIGINAL_LEXICON` members to break distance ties before alphabetical sorting, ensuring shortest-path stability.
- **Ladder Integrity:** `restoreState()` and `submitWord()` strictly validate step-by-step single-letter transitions, target termination bounds, and hint consistency (`hints >= 1` when `hintWord !== null`).

#### 5. Lexicon & Calendar Audit Guards
- **Calendar Insulation:** `scripts/fresh-reserve-20261101.test.mjs` verifies all 182 daily puzzles from 2026-11-01 through 2027-05-01 are distinct and fully excluded from Practice rotation on and before their publication date.
- **Integrity Checksums:** `assertTangleSourceHash()` validates exact 64-character SHA-256 hex digests across all source inputs before parsing, throwing on any drift. Replay payload manifests in `frozen-vocabulary-editions.test.mjs` enforce that published editions remain immutable.

