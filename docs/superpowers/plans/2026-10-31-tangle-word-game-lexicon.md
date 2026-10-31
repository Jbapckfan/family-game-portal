# Tangle Word-Game Lexicon Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans; use independent final review. Steps use checkbox syntax for tracking.

**Goal:** Accept dictionary and established word-game words on every 4×4 and 5×5 Tangle board without resetting scores or raising existing Gold targets.

**Architecture:** Combine pinned full-length English, Wordnik game words, public-domain ENABLE2K and Zynga’s explicitly documented additions. Precompute all legal paths for the existing 430 grids and the optional sample; apply extensions to current/future Daily and Practice while retaining original historical editions and legacy accepted words. Only board-specific accepted lists enter the browser.

**Tech Stack:** Node/TypeScript generation, React, existing Vite/tsx/Playwright tools; no new runtime dependencies.

**Spec:** James’s request: “make sure all dictionary words/words used in a game like Words With Friends.” Three-letter minimum, eight-way adjacency, no cell reuse, existing closed exclusions, earned scores and current Gold goals remain. Exact parity with Zynga’s licensed NASPA/custom dictionary is unverified and must not be claimed. No paid lexicon or API is authorized.

## Global Constraints

- Preserve 32 daily games, the bonus, calendars/grid identities and historical saves.
- Preserve the single owned preview window/tab and current sample progress.
- Retain source/license/hash provenance. No cloud validation during play, paid work, or public deployment.
- Separate broad acceptance from common-word hints. Do not silently add new vocabulary exclusions.

## Review Focus

- Common inflections, specialized word-game entries and long words must not be silently omitted.
- Previously accepted words and old Gold achievements must remain restorable after expansion.
- All bank boards must satisfy coverage, not just the visible sample.
- Three-letter and legal-path rules must still reject invalid input.
- No exact Words With Friends compatibility claim without its full current licensed data.

### Task 1: Sources and completeness regressions

- [x] Pin Wordnik and ENABLE sources and licenses; record Zynga’s current documentation and disclosed additions.
- [x] Add failing regressions for missing game vocabulary, full union coverage, and current/future four-wide expansion.
- [x] Implement the shared generation-time lexicon and board solver; regenerate the sample and all bank extensions.
- [x] Independently compare every generated accepted set against a word-centric full-source solver.

### Task 2: Runtime and saved progress

- [x] Add expansion at four-wide Daily/Practice entry points from October 31 onward, leaving historical source records intact.
- [x] Preserve existing Gold targets, saved found words, valid legacy editions and completion counts; calculate truthful expanded totals.
- [x] Run real-hook and browser tests for saved Daily, sample reload and added word acceptance.

### Task 3: Verify, review and deliver

- [x] Run package/catalog suites, TypeScript, Vite, source/native web parity and Chrome/WebKit flows.
- [x] Obtain a fresh model review, adjudicate findings with evidence, fix material issues.
- [x] Update evidence/ranking follow-up; commit, push and verify feature-branch SHA.

## Ledger

Initial ruling: preserve existing lexicon entries and medal targets while widening acceptance. This avoids invalidating legitimate saved rounds or moving the daily goal after play. The original dated editorial policy stays separate from the new expansion layer.

Final rulings: two existing grids were already complete under the wider source set, so tests require no losses and complete accepted sets, not artificial additions to every board. Kimi/Opus migration findings were reproduced RED and fixed GREEN. Gemini’s fabricated provenance values were rejected. Exact source pins and all four license checksums are enforced. The added source coverage does not certify WWF parity or human familiarity. Final static Opus: no Critical/Important blockers; its notice-check suggestion was implemented and tested runtime bytes stayed identical. All validation recorded in the lexicon report; commit/push/remote verification follows.
