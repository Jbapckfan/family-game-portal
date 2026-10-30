# Counterpart review decisions — October 30, 2026

Counterpart is the third individual review. James subsequently answered yes to playing again and asked for the next game. Counterpart and Switchpath are keepers with no relative order supplied; Ringcount is a replacement candidate. His request for larger, easier-to-read words is delivered. No numerical enjoyment rating was supplied.

| Baseline reviewer | Fun | Clarity | UI | Replay | Sharing |
|---|---:|---:|---|---:|---:|
| Kimi K3.1 Pro | 3 | 4 | 3 | 3 | 4 |
| Gemini 3.8 Flash High | 2.5 | 3 | 2 | 3 | 2 |
| Opus 5.5 | 3 | 3 | Visual declined; interaction 3 | 2 | 3 |

These are predictions about the baseline, not James's rating or post-change measurements. Kimi/Gemini inspected baseline source, the complete 90-record analogy audit and phone/desktop screenshots. Opus inspected inline source/audit without screenshots or CSS. None executed the game. Reports and receipts are preserved unchanged.

## Implemented findings

- **Draft overwrite after auto-advance:** a real regression first reproduced the loss of a saved first word. Advance now proceeds cyclically to the next unfinished row, sanitizes used words, then selects that draft's empty slot. A second red/green regression covers another row consuming a word from the active draft. Explicitly selecting a filled slot still allows replacement.
- **Phone interaction:** the active row appears immediately after the bank, first in both DOM and visual order. Other unfinished rows are compact selectable cues; completed explanations remain. The oversized sticky bank and fixed scroll-offset interaction are removed. Completing a pair reveals/focuses Check; a saved full next draft also focuses Check. Otherwise a successful check returns to the bank.
- **Readability:** James requested larger words during play. Bank words are 16–17px; cues use bold sans-serif 16–18px; filled answers are 17px. Two-column phone tiles provide room. Short screens use natural scrolling; fitting everything into one screen is no longer the goal. Check scrolls into view after the second choice. Long words can wrap rather than clip.
- **Hints and statuses:** a first hint asks for confirmation and discloses one scored hint. Cancel is inert. Status now says CURRENT, unpaired words, assisted/extra checks, or the explicitly labelled perfect goal. Removed the unsupported Enter glyph; actual focused-button Enter works. Escape leaves terminal boards alone.
- **Coaching and accessibility:** generic rejection says “Not the intended match for this row” rather than claiming a submitted analogy has no relationship. One board live-announcement path remains. DOM order matches the active-first layout.
- **Sharing:** frozen allowlisted score/date snapshot; honest perfect/solved/revealed and Daily/Practice; portrait and square PNG; download, native browser file share where supported, copy and manual selection. No words, cues, answers, per-row error pattern or private URL. Native text bridge remains first.
- **Palette:** teal interactive styling follows James's recent preference. No image/brand redesign was required.

## Semantic allegations checked

Every actual board has ten distinct visible words. Repeated words across the 90-record pool are not duplicate tiles on the same board.

The tested reviewer-specific interchangeable groups—instrument, tool/action, covering, growth, introductions, route/traveler, suppression, removal, and the reversed creator/material/collection examples—had no co-board conflicts. This does not prove that every conceivable alternative analogy is impossible.

Applying all 17 broad existing exclusion families to all 210 boards flags five early boards. Manual inspection distinguishes their particular directions/subtypes: collection site versus animal group versus excerpt/source; response/cause versus harm/remedy; evidence/conclusion versus prediction/event; device/output versus request/fulfillment; and practitioner/tool versus evidence-object/specialist. A broad family flag alone is not proof of an unfair accepted-answer set. [Actual audit and manual decisions](evidence/co-board-audit.json).

The engine's enumeration of one accepted ordered pair is an exact-matcher test, not semantic-uniqueness proof. Reviewer concerns about loose wording in ROOT/ANCHOR, NET/CATCH, CANVAS/PAINTER and PRISM/SPECTRUM remain editorial questions for human review. Published boards and save identities were preserved.

## Declined / deferred suggestions

- Kept precise reversed-pair coaching: the wrong check and corrected check each cost an attempt; it is useful recovery and cannot yield a perfect result. Gemini's “free solve” framing overlooks the existing check cost.
- Kept selecting a filled slot for replacement and reversing a one-word draft. Neither was demonstrated as a bug.
- Tutorial direction is an example, not a rule that every row must be tool→user. Different row directions are intentional.
- The 210 distinct board combinations reuse 90 authored analogies, each returning across multiple boards. This is the main replay limitation. No claim of 210 wholly new analogy sets or proven six-month enjoyment.
- DeepSeek was not run: no verified free route was available. No paid API route or new subscription was used.

## Final Opus check

Opus found no Critical/Important issue in the updated inline source, confirmed the original draft fix and sharing allowlist, and reported minor edge cases. The further draft-sanitizing trigger was reproduced and fixed. Full-draft Check focus, singular screen-reader counts, square-card centering and goal wording were also corrected and verified by the author. The final readability request and short-screen scroll refinement came afterward and were checked in actual Chromium/WebKit runs; no claim that Opus viewed that final UI.

Physical iPhone use, VoiceOver/TalkBack and real social-app handoff remain unverified. Font-family declarations match the real Canvas loads and exported images were inspected; older-browser fallback behavior and sharing targets were not universally certified.
