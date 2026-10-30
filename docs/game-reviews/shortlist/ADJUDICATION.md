# Shortlist review decisions — October 30, 2026

Shortlist is the fourth individual review. James subsequently said yes to playing again; Shortlist is a keeper with no numeric or relative ranking supplied. Counterpart and Switchpath are keepers without a supplied relative order; Ringcount remains a replacement candidate. No game has been removed.

| Baseline reviewer | Fun | Clarity | UI | Replay | Sharing |
|---|---:|---:|---|---:|---:|
| Kimi K3.1 Pro | 4 | 4 | 4 | 4 | 3 |
| Gemini 3.8 Flash High | 4 | 3 | 3 | 4 | 2.5 |
| Opus 5.5 | 3 | 3 | Visual declined | 3 | 3 |

These are source-based predictions about the baseline, not James's ratings or measured post-change enjoyment. Kimi/Gemini received source, tests, the strategy audit and phone/desktop screenshots. Opus received inline engine/app/shell/HTML/audit with tools disabled, without CSS or screenshots. None played or executed the game. Reports and receipts are preserved unchanged.

## Implemented findings

- **Evidence and reading:** scan results now appear immediately above the candidate grid, hidden until a scan exists. Jump controls connect the words/results and letter console. Candidate words are 17–18px, alphabet keys 17px, touch cells at least 44px. Phone layout uses six alphabet columns, five on the smallest width. Result letters/counts were enlarged too. There is no automatic elimination or candidate highlighting.
- **Safe actions:** final-pick confirmation remains, including early picks. The first strategy hint asks for confirmation and discloses one scored hint, assistance and no scan spent. After the third scan, the button gives a free rules reminder. Pencil marks remain reversible personal notes and never constrain hint calculations.
- **Keyboard:** third-scan completion focuses an actual candidate. Exhausted/terminal boards do not redirect letter input to the scanner. Clear, Escape and Backspace preserve useful focus; no-op keys do not re-render. Typed letters focus the corresponding key. Hint focus waits until dialog closing finishes.
- **Honest old saves:** a legacy assisted save lacking original hint advice keeps `hints: 1`, `hint: null`, scans and outcome. Reload does not invent new advice. Real saved hint type, pair and scan context remain validated; display wording is regenerated so an old message cannot erase a finished round. An older hint is only pre-selected if it still belongs to the current scan count.
- **Truthful results:** every win says “Secret found” and “You chose the secret word.” A lucky guess does not claim perfect play, informative scans or a unique remaining candidate. Missed and revealed outcomes remain distinct.
- **Sharing:** portrait/square score images and captions contain played Daily date/number or Practice, total scans, hints and factual outcome. The frozen allowlist excludes secret, pick, bank, pencil marks, scan letters/counts and URLs. Fonts and PNG are prepared before file-share gestures; download/copy/manual-copy and cancellation paths remain. Native text bridge remains first; browser file/image sharing does not establish native image sharing.

## Claims checked rather than accepted

Opus's baseline response claimed it grepped CSS and listed the folder despite disabled tools and no inline CSS. Its terracotta palette and target-size claims were unsupported; the final response explicitly retracted them. They were excluded from implementation decisions. Gemini's claim that a `tabindex=-1` container traps keyboard focus was overstated; moving focus to a useful candidate was still an improvement. Its claim that the first scan letter was locked was false: the existing key toggles off. Existing second-letter replacement stays; Clear/Escape make resets obvious.

Default Pencil mode was suggested but not adopted: current pick confirmation already guards the irreversible choice, and the mode note now explains the distinction. Scans, score, published banks and save IDs are preserved. No auto-filter or recommended final answer was added.

The independent strategy traversal covers all **2,520 possible secrets** across **210 distinct banks**, using actual letter-presence counts and the existing answer-independent strategy. Every leaf resolves within three scans. There are **1,051 distinct words** and **210 distinct scheduled answers**. This establishes a valid strategy, not human difficulty, vocabulary fairness, fun or six-month engagement. All stored difficulty labels remain “Sharp”; calibrated difficulty remains a human-playtest question.

## Final Opus review and follow-through

The updated inline-source review found no Critical logic/save/sharing defect. Its Important focus trigger was reproduced: deleting a letter could disable the focused Scan/Clear button. The fix restores focus to a relevant letter; real Chromium/WebKit checks cover both controls. Minor win-copy, stale-hint preselection, typed-key focus and a vacuous legacy-save assertion were also corrected. The save assertion now follows a real committed action. Browser checks cover hint-dialog focus ordering.

The final review ran nothing and did not inspect rendered HTML/CSS, native integration or physical sharing. Author-run browser and build evidence is separate. DeepSeek was not run because no verified free route was available. Existing subscription CLI routes were used; no paid API route or new dependency was introduced.

Physical iPhone use, VoiceOver/TalkBack, real recipient-app handoff and repeated-day enjoyment are pending.
