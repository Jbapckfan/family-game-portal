# Tradeoff panel decisions

James called Tradeoff **a keeper, a bit too easy**. That direct playtest governs its disposition. Model fun/replay estimates are predictions, not votes or James's scores.

| Reviewer | Actual model argument | Fun /5 | Clarity /5 | UI /5 | Replay /5 | Sharing /5 |
|---|---|---:|---:|---:|---:|---:|
| Kimi | kimi-code/k3.1-pro | 3 | 4 | 3 | 2 | 3 |
| Gemini | gemini-3.8-flash-high | 3.5 | 4.5 | 3.5 | 4 | 4 |
| Opus | claude-opus-5-5 | 2 | 3 | — | 2 | 3 |

These are baseline reviews at source commit `a5137a47758b489f0a1a5ac69b615fdc2dc94ba7`. Kimi/Gemini received source, tests, audit and screenshots; Opus received inline engine/app/HTML/audit without CSS/images. Its UI score is therefore null. Existing subscription CLIs were used; no new paid API route or dependency was introduced. No verified free DeepSeek route was available, so no DeepSeek review is claimed. Reviewer reports and receipts are preserved verbatim.

## Implemented and verified

The panel identified stale-action feedback, repeated/unconfirmed hints, small clues, incomplete perfect-score copy and weak sharing. Focused tests first failed for missing sharing and the relevant app cases. The fixes add confirmation, same-board paid-advice restoration, larger controls, truthful score labels, aggregate-only dated PNGs, and explicit cancellation of discarded animations, speech, haptics and timers. A valid terminal game repairs its missing/stale result record.

Final Opus source review found no Critical issue and one Important terminal-concurrency concern. Its minor write-failure propagation, terminal-specific feedback, hinted focus visibility and dirty-memory storage-event findings were corrected afterward. The dirty-memory case was reproduced by a failing test before correction. Invalid share counters now produce a visible message. Font rendering was verified with bundled assets in Chromium and WebKit; `fonts.load()` alone is not claimed to guarantee a face exists. The text nudge glyph is intentional.

## Claims narrowed or declined

Gemini's record-only reveal-to-win concern overstated the ordinary path: the save boundary adopts an already finished daily before writing stale local progress. A new regression explicitly verifies that a first revealed daily survives a stale tab's attempted final winning trade. Freezing every existing record would also prevent a valid saved terminal game from repairing a missing or stale record.

Opus predicted low enjoyment and possible rejection. James subsequently kept the game; his ease concern is recorded separately. Editorial wording questions and broader difficulty/content redesign remain follow-ups. No published clue bank was rewritten. Roving-tabindex and Undo-confirmation proposals were not necessary to this focused pass; normal button/arrow/Home/End/Escape/Undo operation and focus recovery were exercised.

## Open Important finding: simultaneous conflicting finishes

The final Opus report demonstrates that directly replacing a won raw save with a different valid terminal save causes adoption and record reconciliation to that incoming result. It hypothesizes that concurrent browser finalizations can reach this state. Our normal stale-tab write-boundary tests pass, including delayed storage-event delivery and first-reveal preservation; we did not reproduce a literally simultaneous conflicting finish through the production UI.

The broader concern remains valid: localStorage read/check/write is not an atomic transaction. The [HTML Web Storage specification](https://html.spec.whatwg.org/multipage/webstorage.html#introduction) advises authors to assume there is no locking between relevant browser agents. This supports retaining a concurrency limitation; it does not establish the reviewer's specific Chromium cache explanation.

The proposed “win beats reveal” tiebreak was declined because it would replace an earlier revealed result with a later win, changing the first-finished contract. “Always keep my terminal” can cause competing tabs to rewrite forever. A durable, coordinated finalization design and actual simultaneous-browser regression remain open. No claim is made that every Important finding is fixed or that multi-tab terminal finalization is fully certified. This limitation does not change James's keeper verdict.
