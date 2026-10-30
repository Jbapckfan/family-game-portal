# Ringcount review decisions

All three reviewers inspected the same 15-file source/test/screenshot capsule from baseline `5d692780cd52c8bee3263340f06dda771fdd115e`. They did not execute the game. Original reports and receipts are retained alongside this document.

## Adopted and verified in implementation

- **Honest hint control:** all three found “Place a cut” misleading. The button now says Hint and distinguishes placing from moving. Confirmation states that it adds one hint and affects perfect status. Cancel leaves the score untouched.
- **Arc association:** four more distinct colors, stronger arc strokes, readable position labels, and tappable/keyboard-operable total cards highlighting their numbers. Position ranges give a non-color reference. Escape clears the highlight; this is visual state only.
- **Finish clarity:** “Finish circle” appears when four totals match, preserving the explicit scored check.
- **Wrong-check focus:** Gemini identified a disabled-button focus loss. A wrong check now returns focus to an editable cut; browser assertion verifies it.
- **Phone density:** reduced masthead/hero spacing and kept both primary controls on one row. All cut targets remain at least 44×44.
- **Screen-reader duplication:** removed the duplicate status role from visible feedback; the existing polite announcer remains. Physical VoiceOver/TalkBack is still unverified.
- **Metadata:** corrected the “word game” description and removed the static LAN footer address.
- **Social artifact:** implemented the requested square/portrait PNG, image-file share where available, download and caption/manual-copy fallback. Only an immutable allowlisted result reaches the renderer. No answer-dependent ring geometry appears.

## Decisions and costs

- **Preserve cut toggling.** Kimi/Gemini favored a move mode; Opus cautioned that it conflicts with tap-to-remove. The existing two-tap correction is understandable and leaves scoring/saves unchanged. Cost: full boards still need remove then add; James's playtest can establish whether this is frustrating.
- **Preserve live totals and scoring.** Opus correctly observes that positive-number partitions can become routine and that live totals make wrong checks avoidable. Removing help or redefining perfect now would change the game being evaluated. Cost: replay depth may remain modest. This is a ranking concern, not something tests can settle.
- **Keep the image despite mixed reviewer advice.** Kimi favored it; Opus/Gemini preferred text first. James explicitly asked for social-shareable presentation. The image is local and optional; text remains available. Cost: more browser export code, covered by actual PNG and fallback tests.
- **No private link in shared results.** Reviewers asked for a return URL, but the existing site is private and the local test hostname is not reachable by friends. Adding either would imply a playable invitation that is not yet available. Cost: results can be shared visually, but a public challenge link needs a separately authorized audience/deployment decision.
- **No new live region.** The visible balance sentence is not a live region. Existing move announcements continue once per update. A partial match is described only as a total matching, never as a guaranteed correct cut.
- **Native scope:** the existing native text share bridge is preserved. This pass tests browser image export; it does not claim native-app image sharing or physical-device certification.

## Reviewer predictions before changes

| Reviewer | Fun | Clarity | UI | Replay | Sharing |
|---|---:|---:|---:|---:|---:|
| Kimi K3.1 Pro | 4 | 4 | 4 | 3 | 2 |
| Opus 5.5 | 2.5 | 4 | 3.5 | 2.5 | 2.5 |
| Gemini 3.8 Flash High | 4 | 3 | 3 | 4 | 2.5 |

Scores are subjective predictions out of 5 for the baseline, not post-change scores or James's preferences. No overall preference rank is assigned. Opus's concern about repetitive arithmetic and Gemini's more optimistic replay assessment are both retained for James to judge.

## Remaining human checks

Enjoyment after several boards, whether hints feel fair, one-handed phone play, wraparound comprehension, color-vision/low-vision comfort, physical screen-reader announcements, real social-app handoff and repeated-day interest. No fabricated completion times, popularity metrics or retention claims.
