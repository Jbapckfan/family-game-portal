# Alford Daily release gates and editorial workflow

Launch the verified build after the checks below have evidence, owners and a release decision. A successful automated run does not supply James's fun rating, editorial approval or physical-device results.

## Product gates

| Gate | Required evidence | Current action |
|---|---|---|
| Game choice | James's keeper/replacement verdicts and unranked games clearly distinguished | Finish the remaining-game pass, then resume individual reviews |
| Quartet differentiation | A substantive gameplay distinction from Connections, followed by another playtest | Unresolved: James enjoyed it, but the current grouping loop is too similar; see [comparison](../../game-reviews/quartet/ORIGINALITY-2026-11-01.md) |
| Acceptable words | Full pinned-source coverage for each open-word mechanic; rejected everyday-word regressions; separate fixed-clue constraints | Current dictionary repairs and independent all-bank oracles |
| Fair puzzles | A playable witness for every bank entry; unique/deliberate solutions where required; precise semantic labels | Agent engine/data audits plus human editorial review |
| Freshness | Actual Daily selectors produce distinct substantive challenges for the next six months from release; unchanged history | Rerun the calendar/fingerprint audit against the final release date |
| UI and input | Readable 320px phone layout, keyboard/touch flows, high contrast, non-color cues, reduced motion | Actual Chrome/WebKit tests and screenshots, then physical iPhone checks |
| Saves and outcomes | Draft/terminal reloads, old/new dictionary editions, stale tabs, practice separation, honest hints/reveals | Regression suites and real interaction harnesses |
| Sharing | Correct played date, actual result, assistance, no answers, verified exact-game URL | Result text/image checks and native share sheet on device |
| Offline and update | Verified asset hashes, all-game cold boot, corrupt/interrupted download recovery, safe old-tab activation | Existing offline lifecycle harness on final staged bytes |
| iPhone release | Signed device install, launch, accessibility, offline, share, reminders, haptics and long session | Device validation remains a release task; no inference from web parity |
| Public website | HTTPS/custom origin, external-device access, prefix routes, refresh, offline update and rollback | Verify exact deploy after authorization |

## Commercial gates

- Select the real intended age audience before age rating, ad requests or a Kids Category claim. A family project name does not decide its audience.
- Keep source/license notices in the deployed assets. Complete review of dictionary, clue, quote, artwork and name rights before commercial publication.
- Complete the actual support contact, privacy policy, data inventory and retention details for the selected host and ad/payment SDK versions.
- Use test ads and StoreKit testing until entitlement, consent refusal, pending purchase, refund/revocation, offline purchase state, restore/reinstall and paid ad suppression pass on devices.
- Reconcile earlier purchase copy: an ad-free entitlement must not promise future paid collections, indefinite unseen content or cross-platform ownership unless those benefits are built and tested.
- Confirm membership/account agreements, banking/tax, publisher identity, storefronts and local price. No account enrollment or payment is authorized by this preparation pack.
- Prepare exact build/commit, asset manifest, deployment rollback and monitored error/support response before promotion.

## Beta measurement

Begin with observed, consented first play and a small feedback group; no analytics SDK is required for this stage. Record a pseudonymous participant code, build/date, chosen game, first-move understanding, completion/reveal/abandonment, clue use and voluntary next choice. Do not collect typed word guesses or answers in marketing analytics.

Define denominators before reporting:

| Metric | Definition |
|---|---|
| First-game completion | Players reaching any terminal outcome / players starting a game |
| Unassisted solve | Solves without assistance / started games, reported separately from assisted solves |
| Return | Players with a voluntary play session on a later Central date / eligible first-session cohort |
| Share action | Players opening or copying a result share / terminal results; this does not prove a social post or acquired visitor |
| Referred visit | A visit arriving through a measured approved link; a visit is not a new retained player |
| Purchase conversion | New verified purchases / eligible non-owning players exposed to the actual offer in the same cohort/window |
| Ad performance | Displayed impressions, realized publisher eCPM and return/completion changes; requests are not displayed impressions |

Set go/no-go thresholds after observing a baseline, before changing the offer. Compare a fixed build and cohort; do not call a small convenient sample statistically representative. Paid acquisition waits until measured net value and retention justify a budget approved by James.

## Correction workflow

1. Reproduce a reported word/clue error with game, played date, build and exact action. Preserve the save and published puzzle.
2. Classify it as dictionary coverage, mechanic rule, semantic clue, stale build or corrupt progress. Show the actual rule in the UI.
3. Add a failing regression from the report and an independent whole-bank/source check for the broader failure class.
4. Fix with a stable vocabulary/puzzle edition when replay changes. Preserve already earned results; do not silently rewrite past scores.
5. Review the scoped source and exact staged bytes, rerun affected flows and add a concise release note.
6. Verify rollout and old-tab behavior. Circuit's old bundle cannot be retroactively taught newly accepted words; require a coherent closed-tab update and document mixed-version limitations.

Keep each release's horizon and distinctness report. Before the reserve runs out, publish reviewed additions with stable IDs or describe the finite replay cycle honestly. Ten new candidate games do not count as a completed content pipeline until selected, edited and integrated.
