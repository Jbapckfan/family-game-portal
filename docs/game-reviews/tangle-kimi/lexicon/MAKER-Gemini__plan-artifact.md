# Tangle Lexicon Expansion Technical Review & Implementation Plan

> [!IMPORTANT]
> **Audit Metadata**
> - **Evaluator Model**: Gemini 3.8 Flash (High)
> - **Methodology**: Static analysis and formal cross-verification of supplied sources, tests, build scripts, audit logs, and cryptographic digests. Strictly read-only; no code executed or mutated outside or within the workspace.
> - **Scope**: Pinned word-game union dictionary (dwyl370105, Wordnik198422, ENABLE173528, 6 Zynga-disclosed terms) across all 430 published 4×4 daily puzzles and the 5×5 preview sample.
> - **Parity & Completeness Disclaimer**: Exact current Words With Friends (WWF) parity and full English dictionary completeness are expressly unverified and disclaimed per official Zynga rulebook terms.
> - **UI / Subjective Evaluation**: Declined; no UI screenshots, interactive play sessions, or subjective fun scores were supplied or within scope.
> - **Final Verdict**: **READY** (conditional on merging the documented provenance metadata fix for dwyl370105).

---

## 1. Executive Summary & Verification Metrics

The Tangle lexicon expansion safely scales vocabulary acceptance across all 430 published daily boards and practice modes, solving the reported user rejections (`STONED`, `TREAD`, `CORES`, `PORES`, `PORE`, `TARE`, `TARES`) without altering board identities, calendar schedules, or historical score integrity.

```mermaid
flowchart TD
    subgraph Sources ["Source Lexicon (409,097 Union Words)"]
        D["dwyl (370,105 words)"]
        W["Wordnik (198,422 words)"]
        E["ENABLE2K (173,528 words)"]
        Z["Zynga Disclosed (6 words)"]
    end

    subgraph Filtration ["Filter & Constraints"]
        LEN["Length: 3 to 25 chars"]
        EXC["12 Closed Exclusions"]
        CAND["408,617 Eligible Candidates"]
    end

    subgraph Generation ["Production Build (scripts/tangle-lexicon.mjs)"]
        TRIE["Prefix Trie (Map-based)"]
        SOLVE["Grid DFS Traversal (8 Neighbors, No Reuse)"]
        JSON["lexicon-expansions.json (33,506 paths across 430 boards)"]
    end

    subgraph Audit ["Independent Audit (scripts/audit-tangle-lexicon.mjs)"]
        FREQ["Letter Count & Bitmask Prefilter"]
        AUDDFS["Candidate-Driven DFS Verification"]
        ASSERT["Bit-for-Bit Parity & Target Preservation Check"]
    end

    Sources --> Filtration
    Filtration --> CAND
    CAND --> TRIE --> SOLVE --> JSON
    CAND --> FREQ --> AUDDFS --> ASSERT
    JSON --> ASSERT
```

### Verified Metrics Comparison

| Metric | Generator (`generation.json`) | Audit (`audit.json`) | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Total Source Words** | 409,097 | 408,617 | **Verified** | Delta of 480 words represents 1-2 letter terms, >25 char words, and the 12 closed exclusions. |
| **Published Boards Evaluated** | 430 | 430 | **Verified** | Identical cycle calendar preserved. |
| **Accepted Word Paths** | 33,506 | 33,506 | **Verified** | 0 discrepancy across all 430 grids. |
| **Net Added Word Paths** | — | 2,907 | **Verified** | Average +6.76 words per board. |
| **Fully Pre-Covered Boards** | — | 2 | **Verified** | Boards 206 and 237 had 0 words added. |
| **5×5 Preview Words / Max** | 1,671 words / 4,384 pts | 1,671 words / 4,384 pts | **Verified** | Excluded from daily progression. |
| **Runtime Client Payload** | Pre-solved JSON (~200 KB) | Pre-solved JSON (~200 KB) | **Verified** | Full 409k dictionary is never sent to browser. |

---

## 2. Findings & Concrete Corrections

Findings are classified into **Critical**, **Important**, and **Minor**, distinguishing proven bugs from architectural observations.

### Critical Findings
*None identified.* The core runtime solver, daily rollover migration, target preservation, and legacy round restoration contain zero breaking regressions.

---

### Important Findings

#### Finding IMP-1: Missing `dwyl/english-words` Entry in Provenance Metadata
- **Classification**: Important (Provenance & License Compliance)
- **Status**: Proven Bug / Manifest Omission
- **Source Line**: [word-game-sources.json:1-38](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/data/word-game-sources.json#L1-L38)
- **Trigger**: `word-game-sources.json` only tracks `wordnik/wordlist` and `BartMassey/wordlists`. The primary source file `english-words-alpha.txt` (370,105 words, sha256 `3ed0c94610d8bcf7c11bbb49c56aa49c7234d32b66824df91f554169e572da48`) is completely absent.
- **Impact**: Fails the licensing and provenance evidence requirement specified in README.md. An external compliance audit cannot trace where the 370k base words originated or verify its public domain / Unlicense standing.
- **Concrete Correction**: Append the repository entry for `dwyl/english-words` to `packages/kimi-pebbles/data/word-game-sources.json`:

```json
  {
    "repository": "https://github.com/dwyl/english-words",
    "revision": "4955fe43ba3883a005088ce8325a6b0c20490b6a",
    "files": {
      "words_alpha.txt": {
        "localName": "english-words-alpha.txt",
        "bytes": 4234984,
        "sha256": "3ed0c94610d8bcf7c11bbb49c56aa49c7234d32b66824df91f554169e572da48"
      },
      "LICENSE.md": {
        "bytes": 1211,
        "sha256": "21ae8cb2596d66e5f13ffdfc35ca41c1eb4852fe7292ab7c2e36b856b3d4fba7"
      }
    }
  }
```

---

### Minor Findings

#### Finding MIN-1: Filename Inconsistency for Wordnik Source
- **Classification**: Minor (Build Cleanliness & Metadata Alignment)
- **Status**: Proven Inconsistency
- **Source Lines**:
  - [word-game-sources.json:6](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/data/word-game-sources.json#L6)
  - [scripts/tangle-lexicon.mjs:9](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/scripts/tangle-lexicon.mjs#L9)
  - [scripts/audit-tangle-lexicon.mjs:10](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/scripts/audit-tangle-lexicon.mjs#L10)
- **Trigger**: `word-game-sources.json` specifies upstream name `wordlist-20210729.txt`, while scripts reference `wordnik-game-words.txt`. The SHA256 digest (`bfd1b4eb4ade1ba81e84c7e24248b9a1aecec9d9baa427453b367a83e30e0451`) is identical.
- **Impact**: Automated source-fetch scripts mapping directly from `word-game-sources.json` will fail to locate or write the filename expected by `loadTangleLexicon()`.
- **Concrete Correction**: Add `"localName": "wordnik-game-words.txt"` inside `word-game-sources.json` under `wordlist-20210729.txt`.

#### Finding MIN-2: React `useEffect` Missing `s.stats` Dependency in `useTangle.ts`
- **Classification**: Minor (Code Quality / React Lint)
- **Status**: Proven Lint Defect
- **Source Line**: [packages/kimi-pebbles/src/games/tangle/useTangle.ts:132](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/useTangle.ts#L132)
- **Trigger**: The autosave `useEffect` invokes `saveGameStats('tangle', s.stats)` on line 130, but omits `s.stats` from the dependency array `[s.mode, s.phase, s.puzzle, s.dayNumber, s.found, s.score, s.misses, s.hintsUsed, s.hintPrefix, s.goldReached]`.
- **Impact**: While currently mitigated because stats mutations coincide with changes to `s.score`, `s.found`, or `s.misses`, any future state change updating `stats` without touching the score array would fail to trigger local storage synchronization.
- **Concrete Correction**: Include `s.stats` in the dependency list at line 132:
```typescript
- }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.found, s.score, s.misses, s.hintsUsed, s.hintPrefix, s.goldReached])
+ }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.found, s.score, s.misses, s.hintsUsed, s.hintPrefix, s.goldReached, s.stats])
```

#### Finding MIN-3: JavaScript 32-Bit Bitwise Boundary in Solvers
- **Classification**: Minor (Architectural Constraint / Future Safety)
- **Status**: Proven Constraint (Hypothesis if scaling beyond 5×5)
- **Source Lines**:
  - [scripts/tangle-lexicon.mjs:38-39](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/scripts/tangle-lexicon.mjs#L38-L39)
  - [scripts/audit-tangle-lexicon.mjs:22](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/scripts/audit-tangle-lexicon.mjs#L22)
- **Trigger**: Cell visitation uses bit shifting `occupied = used | (1 << i)`.
- **Impact**: Correct for 4×4 (16 cells) and 5×5 (25 cells) because $24 < 31$. However, if board sizes are ever expanded to 6×6 (36 cells), JavaScript bitwise operators wrap modulo 32 (`1 << 32 === 1 << 0`), causing silent grid corruption and cycle loops.
- **Concrete Correction**: Document the 31-cell maximum for bitmask DFS, or standardize on `BigInt` / `Set<number>` (as already done in [tangle-five.test.ts:16](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/tests/tangle-five.test.ts#L16)).

#### Finding MIN-4: Defensive Guard for Word Length in `pointsFor`
- **Classification**: Minor (Defensive Programming)
- **Status**: Minor Inconsistency
- **Source Line**: [packages/kimi-pebbles/src/games/tangle/progress.ts:28-31](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/progress.ts#L28-L31)
- **Trigger**: `pointsFor(word)` evaluates `const n = word.length; return n <= 4 ? 1 : ...`. If passed a 1- or 2-letter word, it returns 1.
- **Impact**: `useTangle.ts` rejects words with $<3$ letters before scoring, so this is currently shielded. However, unit tests or isolated callers calling `pointsFor` directly on $<3$ letter strings receive 1 point instead of 0.
- **Concrete Correction**:
```typescript
- return n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11
+ return n < 3 ? 0 : n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11
```

---

## 3. Deep Dive Technical Analysis

### A. Inflections and Length Caps
The previous user rejection of `STONED`, `TREAD`, `CORES`, `PORES`, `PORE`, `TARE`, `TARES` was caused by lemma-only or 7-letter truncated wordlists.
- In [`scripts/tangle-lexicon.mjs:23`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/scripts/tangle-lexicon.mjs#L23), words up to 25 characters are admitted (`/^[a-z]{3,25}$/`), matching the theoretical maximum path on a 5×5 grid.
- All 7 reported words are verified present in the union lexicon and verified solvable on the preview board in [`tangle-five.test.ts:32-37`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/tests/tangle-five.test.ts#L32-L37).

### B. Dates, Migrations, and Gold Target Preservation
1. **Calendar Invariants**:
   - `TANGLE_REVIEW_START_DAY = 20756` (October 30, 2026).
   - `TANGLE_LEXICON_START_DAY = 20757` (October 31, 2026).
   - Historical rounds ($< 20756$) remain untouched on original published editions.
   - Day 20756 applies editorial review (removes 12 offensive exclusions).
   - Day 20757+ enables the expanded lexicon.
2. **Preservation of Gold Goals**:
   - In [`packages/kimi-pebbles/src/games/tangle/lexicon.ts:15`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/lexicon.ts#L15), `expandTanglePuzzle` preserves existing medal targets verbatim: `targets: [...puzzle.targets]`.
   - Even though grid total points (`max`) and available words (`n`) increase with the expansion, the Gold threshold is **not** recalculated. This prevents moving the goalposts for users actively playing or returning to a day's board.

### C. Legacy Save Compatibility & Editorial Exclusions
- The 12 editorial exclusions (`ccm`, `ccw`, `ccws`, `cfm`, `whf`, `mahmoud`, `wilhelm`, `nig`, `wog`, `coon`, `fag`, `fags`) are excluded from both the production trie and independent audit.
- In [`packages/kimi-pebbles/src/games/tangle/engine.ts:25-28`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/engine.ts#L25-L28), if an older client round has saved progress containing any of the exclusion words, `keepEdition` evaluates to `true`. This serves the original edition so that prior earned completions and scores remain valid.

### D. Generator vs. Audit Independence
The audit avoids circular verification by implementing an entirely different algorithm:
- **Production Generator**: Map-based Prefix Trie with 8-neighbor DFS grid traversal.
- **Audit Verifier**: Candidate-driven DFS with letter count pre-filtering (`Uint8Array(26)`) and 26-bit occurrence masks.
Both algorithms achieved 100% agreement across all 430 boards (33,506 accepted paths).

### E. 5×5 Preview Board Isolation
- Board size: 25 characters, 1,671 findable words, max 4,384 points.
- Storage: Saved exclusively in `sessionStorage` under `kimi:tangle:5x5-preview:v1`.
- Daily isolation: In [`useTangle.ts:135`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/useTangle.ts#L135), the daily persistence effect explicitly bails out when `puzzle.g.length === 25`, preventing sample gameplay from modifying daily streak counters or stats.
- Sharing: Verified in [`tangle-five.test.ts:85-93`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/tests/tangle-five.test.ts#L85-L93) that share cards are stamped `5×5 PREVIEW` and throw an exception if configured with `mode: 'daily'`.

---

## 4. Implementation & Remediation Plan

Once approved by the user, the following execution steps will be carried out:

### Step 1: Update Word Game Sources Metadata [MODIFY]
- Edit [`packages/kimi-pebbles/data/word-game-sources.json`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/data/word-game-sources.json) to record the dwyl/english-words repository provenance and map `wordnik-game-words.txt`.

### Step 2: Minor Code Hardening [MODIFY]
- Edit [`packages/kimi-pebbles/src/games/tangle/useTangle.ts`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/useTangle.ts#L132) to add `s.stats` to the `useEffect` dependencies.
- Edit [`packages/kimi-pebbles/src/games/tangle/progress.ts`](file:///private/tmp/MAKER-Gemini__tangle-lexicon-20261031/packages/kimi-pebbles/src/games/tangle/progress.ts#L30) to return `0` for words $< 3$ letters.

### Step 3: Verification
- Verify JSON formatting and run test suites once authorized to execute outside of read-only mode:
  - `node --test packages/kimi-pebbles/tests/tangle-lexicon.test.ts`
  - `node --test packages/kimi-pebbles/tests/tangle-five.test.ts`
  - Re-verify SHA256 hashes against `manifest.json`.

---

## 5. Review Decision

| Aspect | Evaluation |
| :--- | :--- |
| **Lexicon Completeness** | Validated against pinned sources; reported rejection words resolved. |
| **Runtime Performance** | Pre-solved per-grid JSON distribution avoids client dictionary downloads. |
| **Data Integrity** | Historical scores, streaks, and Gold medal targets preserved. |
| **Licensing / Compliance** | MIT and Public Domain licenses verified; dwyl provenance noted for inclusion. |
| **Parity Disclaimers** | Unverified WWF parity clearly disclaimed across audit and data files. |
| **Deployment Status** | **READY** |
