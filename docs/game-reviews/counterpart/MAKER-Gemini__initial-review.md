### Scope & Inspection Disclosure
- **Inspected files:** `README.md`, `manifest.json`, `games/counterpart/` (`engine.mjs`, `app.mjs`, `shell.mjs`, `styles.css`, `index.html`, `content-identity.mjs`), all 7 test suites (`app-drafts`, `content-identity`, `engine`, `expansion`, `product`, `puzzles`, `shell`), `output/counterpart-review-20261030/analogy-audit.json`, and `baseline-browser.json`.
- **Visuals:** Native image rendering inspected for [before-390.png](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/output/counterpart-review-20261030/before-390.png) (mobile) and [before-1440.png](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/output/counterpart-review-20261030/before-1440.png) (desktop).
- **Execution:** Zero runtime execution, dry-runs, or test commands were run. All findings derive purely from static file analysis and visual inspection. Source inspection is not playing.

---

### Analogy & Content Audit (90 Curated vs 210 Boards)
The 210 boards recombine 90 authored analogies across 5-row combinations (10–14 appearances each) rather than 210 distinct analogy sets. While automated tests enforce single-solution permutations per board, semantic inspection highlights several structural frictions:

1. **Semantic & Directional Ambiguity:**
   - **`TEACH → LEARN` :: `TELL → HEAR` (#63):** Teaching to learning represents intentional instruction resulting in cognitive acquisition; telling to hearing is mere utterance meeting passive sensory reception (hearing does not imply comprehension).
   - **`PRISM → SPECTRUM` :: `KILN → CERAMICS` (#74):** Ceramics is an intentional manufactured craft object created by a kiln; a spectrum is an optical dispersion phenomenon produced when light refracts through a prism.
   - **Directional Traps:** `CANVAS → PAINTER` (#58: medium → creator) directly inverts the tutorial card `BRUSH → PAINTER` (tool → user) and `SCRIBE → PEN` (#10: creator → tool). Inverting entity/instrument directions across similar artisanal domains creates arbitrary traps.
   - **Grammatical Asymmetry:** `SEED → SOW` :: `VOTE → CAST` (#43) pairs nouns with verbs where `VOTE` and `CAST` readily read as noun-noun or verb-noun.
2. **Bank Collisions Across Puzzles:** Certain words recur across different analogy families in the pool: `ECHO` functions as trace-to-source in #4 (`EMBER → FIRE` :: `ECHO → SOUND`) but as sensory phenomenon in #35 (`MIRAGE → SIGHT` :: `ECHO → HEARING`); `CLAY` appears in #17 and #58.

---

### Coaching Defects ([`engine.mjs`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/engine.mjs#L49-L52), [`app.mjs`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs#L86))
- **Over-Revealing on Reverse:** When a submitted pair matches the target in reverse order, `submitPair` sets `feedback: 'reverse'`, triggering: *"You found the two words. Their direction is reversed; try Reverse."* This confirms both words with certainty, reducing a 50/50 directional slip into an immediate free solve on the next check.
- **Mislabels Valid Alternatives:** Any non-matching guess triggers: *"That pair doesn’t carry the same relationship in that order."* This dogmatically mislabels valid alternative analogies (or authentic pairings intended for another row on the board) as lacking relationship entirely, rather than clarifying they do not match that row's specific target.

---

### UI, Layout, and Controls ([`styles.css`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/styles.css#L95-L100), [`app.mjs`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs))
- **Color Palette:** The UI is dominated by terracotta, salmon, and peach (`--accent: #b2573f`, `--wash: #f7e6dd`). This directly clashes with James's preference for compact blue/teal layouts over warm brown/purple palettes.
- **Mobile Scroll Whiplash:** On 390px viewports, the 10-word bank spans ~280px vertically. In [`app.mjs:89`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs#L89), solving a row invokes `analogy.active.scrollIntoView({block:'start'})`. This pushes the word bank completely off-screen above the fold, forcing constant yo-yo scrolling between bottom rows and the bank.
- **Unconfirmed Hints ([`app.mjs:91-95`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs#L91-L95)):** Tapping `✦ Hint` immediately commits `engine.useHint` without a confirmation prompt. Positioned right beside `⇄ Reverse` and `Check pair ↵`, an accidental tap permanently forfeits a "Perfect" score.
- **Control Inconsistencies:** Tapping a filled answer slot only selects it for replacement; it does not clear the tile back to the bank. `⇄ Reverse` is enabled when only one tile is placed (`draft.some(Boolean)` in [`app.mjs:60`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs#L60)), swapping an empty slot with a word.
- **Misleading Statuses:** The active row badge shows cryptic ellipsis text (`as…`), and the win dialog renders five inert, uncolored tan boxes (`result-strip`). A prominent `Developed by ChatGPT` attribution sits under the masthead.

---

### Scoped Improvements (5 Recommendations)
1. **Gate Hints with Confirmation:** Add a brief confirmation step to `hint(index)` in [`app.mjs`](file:///private/tmp/MAKER-Gemini__counterpart-review-20261030/games/counterpart/app.mjs#L91) so players cannot burn a hint by accidentally tapping adjacent action buttons.
2. **Fix Mobile Scroll Position:** Remove `scrollIntoView({block:'start'})` on mobile; keep the word bank sticky or dock the active row's slots near the bank to eliminate jarring layout shifts.
3. **Soften Coaching Copy:** Replace absolute semantic denial with neutral feedback (*"Not the match for this row"*), and replace the explicit reverse confirmation with an ambiguous prompt (*"Check direction or relationship"*) to avoid giving away the row.
4. **Slot Tap-to-Clear & Reverse Guard:** Clear an answer slot when tapped while filled; restrict `⇄ Reverse` to require both words present (`draft.every(Boolean)`).
5. **Spoiler-Free Result Card:** Offer a clean square/portrait graphic card showing date, mode, attempt count, and hint count without exposing words or row solutions.

---

### Provisional Scores & Playtest Requirements
- **Fun: 2.5/5** (Analogy solving is neat, but rigidity and single-author interpretation create friction)
- **Clarity: 3/5** (Rules are simple, but `as…` and dogmatic rejection messages mislead)
- **UI: 2/5** (Terracotta/brown palette clashes with preferences; mobile bank-to-row scrolling is fatiguing)
- **Replay: 3/5** (90 recurring analogies across 210 combinations will feel repetitive over weeks)
- **Sharing: 2/5** (A flat 5-square green strip lacks solve drama and visual interest)

*Needs Human Playtest:* Evaluate whether solvers find the directed distinctions intuitive or pedantic, measure mobile thumb fatigue during bank-to-row navigation, and assess player frustration when authentic alternative word pairs are rejected.

