# Independent Claude Opus 5.5 review prompt

**Status when packaged: not run.** The preparation environment had no callable Claude integration, Claude CLI or configured Anthropic authentication. This file is a complete review assignment, not a completed review.

On an authenticated Mac with Claude Code, start the explicitly selected model:

```bash
claude --model claude-opus-5-5
```

Then paste the assignment below or ask the session to read this file. The model name is documented by Anthropic; account availability and current model configuration must be checked when running. If the session falls back to another model, disclose that and do not label its work Opus 5.5. Keep normal permission controls enabled.

---

Independently review and play **all 32 Alford Daily games** for James / Cursed Toaster Studios. You must be the actual Claude Opus 5.5 model; state the model and tools available. If you cannot interact with a browser, report that limitation and do not claim to have played the games.

Read the repository instructions and deployment/launch context, but avoid reading puzzle solutions or Astra's per-game judgments before your first play attempt. Use a separate browser profile or Practice mode so you do not corrupt the owner's daily results. The public build is the extracted `web/` directory or a freshly staged equivalent. Serve it over local HTTP using the existing preview launcher; do not open ES modules directly as files.

The catalog contains:

| Group | Required games / slugs |
| --- | --- |
| ChatGPT | `ringcount`, `switchpath`, `counterpart`, `shortlist`, `second-sense`, `sideways`, `tradeoff`, `inbetween` |
| Kimi | `kimi-cairn`, `kimi-morph`, `kimi-tangle`, `kimi-hunch`, `kimi-circuit`, `kimi-quartet` |
| DeepSeek | `deepseek-twin-hive`, `deepseek-spare`, `deepseek-rung`, `deepseek-cipher`, `deepseek-trail`, `deepseek-split` |
| Qwen | `qwen-quadra`, `qwen-logic-lattice`, `qwen-syntax-siege`, `qwen-memory-maze`, `qwen-pattern-prism`, `qwen-territory-tactics` |
| Claude | `claude-dovetail`, `claude-splice`, `claude-sprout`, `claude-tangle`, `claude-keystone`, `claude-tumbler` |

For each game, understand the visible instructions, make a complete practice attempt, exercise at least one relevant recovery or hint path, and inspect the final result. Record a meaningful failed attempt honestly if you cannot win. Do not fill answers by hidden-state injection or call a solver and present that as blind play. A source-assisted solution may be useful for a separate end-to-end correctness check, but label it clearly and enter it through the visible controls.

For the changed games—Twin Hive, Circuit, Hunch, Memory Maze, Kimi Tangle and Territory Tactics—test the concrete release fixes. Try additional newly added Territory boards as well as a preserved warmup. Check that EARS and PLUM are accepted only where the board's rules permit them, that restored progress is valid, that Hunch exposes meaningful non-color feedback, that Memory Maze's instructions match its phase, and that Tangle's revised win target remains satisfying and reachable. Try both a phone-sized layout and a desktop layout if supported. Record any environment that could not be exercised.

After the blind attempts, inspect the engines, state restoration, puzzle banks and generators. Verify at least 30 distinct scheduled daily IDs per game starting from the intended launch date, using the supplied audit. Distinguish meaningful content from rotations, shuffled presentations and recombined pools. Inspect the current inventory's minimum of 120 records per game and 8,001 total; do not use record count as proof of long-term editorial freshness.

Review the experience against these questions:

1. Can a first-time player explain the goal and controls without external coaching?
2. Is each game visually distinct while sharing predictable home/help/daily/practice behavior?
3. Does challenge come from worthwhile decisions and fair vocabulary?
4. Are mistakes recoverable and hints useful without being miscounted as clean wins?
5. Are color, keyboard, focus, labels, motion and touch targets accessible?
6. Do Daily, Practice, reload/resume, day rollover and game-to-home navigation behave correctly?
7. Are there incorrect answers, ambiguous clues, valid common words rejected, unwinnable states or trivially repeated puzzle structures?
8. Does the paid-product proposition depend on capabilities or new content that do not yet exist?

Do not change code during the independent first pass. Produce `docs/opus-5.5-review-YYYY-MM-DD.md` with one row for every game: model, puzzle ID/practice number, blind versus assisted method, actions, result, difficulty judgment, concrete issue, severity and evidence. Rank fixes by player impact. Label observations, code-derived inferences and proposed product experiments separately. Include browser/tool constraints and which boards were not played. Do not infer typical human solve time from automation time.

Then compare with the existing Astra reports, identify genuine disagreements and resolve them against the game rules or a reproducible test. Propose modest changes for demonstrated excessive ease or difficulty. Preserve the existing published puzzle IDs and saves. If asked to implement fixes, make focused changes, add meaningful regression coverage, rebuild affected bundles, sync native copies and replay the changed flow before claiming completion.

Finish with a recommendation for **friends beta**, **public free beta**, and **paid launch** separately. A game can be acceptable for a labelled beta while still needing editorial or accessibility work before it is sold. Do not publish, change DNS, activate payments or contact testers as part of this review assignment.

---

References: [Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/overview) · [Claude Code model configuration](https://code.claude.com/docs/en/model-config).
