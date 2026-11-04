# Split — harder sample, November 4, 2026

James approved “try the harde sample, open it for me,” then reiterated a more difficult game. The separate sample uses two six-letter words, a sixteen-tile rack with four decoys, indirect clues and optional definitions. Correctness is shown only after checking both full words together; feedback gives the number correct without naming the row. There is no timer or strike limit.

The default entry opens the sample during review; `#daily` opens the original daily. Sample saves use `deepseek-split:harder-preview:v2`. Original puzzle records and daily saves remain intact. This is one authored example, not a new six-month bank. Split's retention remains undecided after “good but too easy.”

Touch tiles, typed letters, Up/Down row choice, Backspace, returning a particular tile, Clear, reveal confirmation, saved results and spoiler-free copying are supported. Definitions and checks survive clearing. The original engine's tile bounds now use the puzzle rack length, enabling sixteen tiles without changing ten-tile daily behavior.

Nine focused engine tests passed. Fourteen Chrome/WebKit checks passed: complete touch and keyboard solves and reloads, share fallback, editing, definitions, reveal cancellation and restoration, original-daily save isolation, and 320/393/1200-pixel layouts. Every tested rack/slot target was at least 44 pixels. Native web resources matched across 33 entries, two shared runtimes and 304 files. No native binary or public deployment is claimed.

The earlier preview controller had exited. One new visible game tab was opened in the retained review profile; its 0/12 sample screen was inspected without entering a move or hint. Controller session for this launch: 83807.

Requested Kimi, Opus and Gemini static source reviews are running through the existing subscription CLIs. No free DeepSeek route or review is claimed. Raw receipts, browser results and test logs are under `output/split-harder-20261104/`. Model reviews do not establish human difficulty or enjoyment.


The full collection suite passed 982 tests before the final clue-rack/terminal-save tightening; the nine focused engine tests and fourteen browser checks passed again afterward. Initial full-suite failure came from bare `location` in the DOM harness; using `window.location` fixed it.

Opus and Gemini completed static reviews of the initial rack. They identified plausible first-word alternatives that also left enough letters for the second answer. Two decoys were changed (L/S to B/H), and the sample/save ID was versioned so the initial sample's progress is retained separately. A search through the pinned dwyl and Wordnik six-letter lists after reserving the second answer found no further compelling clue match in editorial inspection; this is not universal dictionary certification. Both models' suggested alternatives require letters absent from the corrected rack. Typed-start and reveal-cancel focus, touch-action behavior, terminal labels and zero-check forged wins were also repaired. The corrected round was reloaded in the same single tab.

These reviewers inspected source, not actual play. Kimi remains pending. Additional polish such as retaining Tab position through all board redraws and clearer screen-reader placement announcements remains a follow-up; physical accessibility has not been certified.
