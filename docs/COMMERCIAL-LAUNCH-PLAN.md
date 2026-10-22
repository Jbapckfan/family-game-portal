# Alford Daily — commercial launch plan

Prepared for James / Cursed Toaster Studios, October 22, 2026.

The companion [brand and monetization strategy](BRAND-AND-MONETIZATION-STRATEGY.md) provides the naming decision, screened alternatives, current comparable offers and the selected initial **$19.99 Collection One** price hypothesis. This document supplies the operating plan; broader price ranges below remain possible tests rather than simultaneous offers.

## Recommendation

Launch a free, clearly labelled friends beta on the web, under a dedicated address such as `play.cursedtoasterstudios.com`. Keep **Alford Daily** as its own product, with **Cursed Toaster Studios** as publisher. Use the NAS for a local build and optional remote beta, while preferring managed static hosting for the eventual public service. The current games run in the browser, so a paid application server is not needed to begin testing.

Keep all 32 games available during the beta, but invite players to start with a small daily selection. Ringcount, Switchpath, Counterpart and Sideways are sensible initial flagship candidates because they offer different interactions. This is a product hypothesis to test, not a claim that they have already demonstrated retention or willingness to pay. The completed Astra play reports are evidence about functionality and an expert first impression; they are not a substitute for a human cohort.

The recommended first commercial offer is a **one-time unlock for a clearly defined collection or season**. Consider a subscription only after a dependable editorial pipeline and repeat use are demonstrated. A finite prepared bank does not, by itself, support a promise of indefinitely new daily content.

## What is ready, and what is not

The release contains 32 games and 8,001 prepared puzzle records, with a minimum of 120 in every game. The actual daily selector for every game was exercised for October 23–November 21, 2026: each selected 30 different puzzle IDs, for 960 scheduled daily selections. Practice exposes the larger banks immediately. See `puzzle-inventory.json` and `daily-runway.json`.

These are prepared boards and daily sets. Several use different combinations of shared authored material: Twin Hive has five letter banks, Second Sense has 75 word pairs, Counterpart has 90 analogies, Syntax Siege has 18 wave banks, and Keystone has 174 arches. The count is not a claim of 8,001 completely independent pieces of authored content. Banks eventually cycle. Their limitations and validation are recorded in `verification-puzzles-2026-10-22.md`.

The current product provides daily/practice play, separate game identities, local progress and an integrated iOS project. This handoff does **not** claim that production payments, a central player database, cross-device saves, centrally collected product analytics, a new public hostname, or a live NAS update have been completed. Existing imported placeholder subscriptions and product IDs remain inactive.

## Product and presentation

The shared collection should consistently provide the same home navigation, Daily/Practice labels, help, progress vocabulary, accessible controls, hint/reveal distinction and spoiler-free share format. Each game can keep its own palette, typography accents, board shape, motion and interaction. The board should remain the visual focus; framework names and implementation details do not belong in the player flow.

For the commercial homepage, lead with the experience: **a short daily ritual with several kinds of word and logic challenge**. Give a new player three good starting choices and an obvious “Explore all games” route. Do not require someone to choose among 32 equally prominent choices before discovering whether they like the product. Preserve the creator and source credits in the game details and credits area; do not imply that an integration model originally implemented a game it only completed.

There are two different games named Tangle, by Kimi and Claude. The beta distinguishes them by creator and permanent slug. Before selling the collection, choose clear player-facing names or subtitles and review availability; preserve internal IDs so saves survive a display-name change. Do not promise that any proposed name is legally cleared.

The studio homepage currently introduces Sudoku³: Supercharged. Give Alford Daily its own product card and route when that site change is authorized. A standalone game subdomain keeps the studio website and the collection independently maintainable.

## A practical 30-day friends beta

Recruit roughly 15–25 friends who include casual players and experienced puzzle solvers, using both phones and computers. These are proposed cohort sizes, not statistical guarantees. Do not ask each person to finish all 32 games daily. Ask them to play three to five games per visit, with a rotating assignment that covers the whole collection in the first week.

| Period | Work | Evidence to collect |
| --- | --- | --- |
| Days 1–3 | Verify opening, onboarding, controls, mobile layouts, and first completion. Watch several people play without coaching. | Where players hesitate; incorrect taps; loading failures; whether they understand winning and hints. |
| Days 4–7 | Rotate through every game. Fix reproducible blockers promptly. | Start/completion counts by game and puzzle; active time; wrong attempts; hint/reveal use; too easy/just right/too hard. |
| Days 8–14 | Let people choose what they return to. Keep the daily schedule stable. | Which games they choose voluntarily; return visits; repeat-word complaints; whether sharing brings another player. |
| Days 15–21 | Compare improved onboarding or modest balance changes on practice boards. | Before/after evidence on the affected game, with the version recorded. |
| Days 22–30 | Test a concrete paid offer without charging until checkout and terms are ready. | Preferred bundle, price reaction, intent backed by a clear action, and reasons for declining. |

Use the included tester guide and feedback template initially. A simple form or shared document is sufficient for the first cohort, and its destination should be created in James's account. Do not silently add third-party analytics. If analytics are added, record only the fields needed for decisions and describe what is collected. Avoid collecting raw guesses or personal information by default.

Define each metric before interpreting it. For example, “day-seven return” can mean a tester who started on day one and returns on day seven; it is different from “visited at least once during the following week.” Report the denominator and device mix. With a small friends cohort, treat changes as directional evidence and inspect the individual sessions behind them.

## Difficulty policy

Do not make every game equally difficult. Easy warmups, medium daily puzzles and optional harder challenges serve different players. Challenge should come from the puzzle's decisions, not unclear controls, obscure abbreviations, rejected ordinary words, or unexplained constraints.

Suggested initial design targets, to validate with people:

| Type | Typical active session hypothesis | Intended feeling |
| --- | --- | --- |
| Warmup | 1–3 minutes | Understand quickly and earn an early success. |
| Main daily puzzle | 3–8 minutes | A few meaningful decisions, with a useful optional hint. |
| Longer challenge | 8–15 minutes | A clearly signposted deeper attempt, with recovery and a fair reveal. |

These ranges are planning assumptions, not measured performance. Judge a game using completion, hint/reveal rate, frustration comments, repeated play and whether players can explain why an answer is correct. A fluent adult AI reviewer completing a word game quickly is insufficient reason to make it harder for everyone.

When a game is consistently too easy, first improve the decoys, reduce an unnecessary giveaway, or add an optional harder practice mode. When it is consistently too hard, improve the explanation, remove obscure compulsory vocabulary, clarify a constraint, or make the first hint more informative. Adjust one cause at a time. Preserve already-published puzzle IDs, historical dates and saved progress; record any difficulty version change.

The Astra pass identified concrete corrections in fair word acceptance, Kimi Tangle's score target and Hunch's screen-reader feedback. Territory's ninety unpublished additions now require choosing between two enemy groups, including a smaller legal capture that does not meet the goal; the original thirty published positions remain intact. This raises the decision-making modestly while preserving the two-move budget. Read the individual review reports for implemented changes and the remaining editorial limitations. The Opus 5.5 pass remains a separate pending review until an actual model session is available and produces its own evidence.

## Content operations

Assign one person to approve the next month of daily material. Every new record needs an engine validity check, a meaningful novelty check and a human editorial check. Word games also need checks for common accepted alternatives, ambiguous clue wording, proper names, offensive entries and words that are technically present in a dictionary but unsuitable for the intended audience.

Maintain an eight-week editorial buffer beyond the next announced release date, with a per-game calendar. This is a proposed operating target. Track reusable subcontent, not just board IDs: a new combination of familiar word pairs can still feel repetitive. Keep the release generators deterministic and append-only wherever possible. Re-run the 30-day selector audit from the planned launch date after each bank change.

A commercial launch should initially promote the strongest six to eight games, selected from beta evidence. The rest can remain a clearly marked experimental collection or be refined before promotion. This preserves variety while concentrating editorial and support effort. Do not remove the user's current games or saves as part of making that marketing decision.

## Monetization experiments

The following prices are **test hypotheses**, not market research findings or commitments:

1. A free daily sampler and a **$14.99 versus $24.99 one-time collection/season unlock**. Clearly define the included games, archive and content period. Avoid an undefined lifetime promise.
2. If users return regularly and new content is reliably produced, test **$2.99/month versus $24.99/year** for archive access, continued authored content and useful convenience features.
3. Leave advertising out of the friends beta. Measure whether players value the puzzles before adding interruptions, tracking dependencies or ad SDK work.

Do not activate both experiments at once. Ask testers to choose between concrete offers, then run a small real purchase experiment only when payment handling, restore/refund support, terms and delivery are ready. The current static JavaScript bank is downloaded to the player's browser; hiding a button in client code is not a reliable paid entitlement system. A paid web service would need server-validated access, while an iOS release needs its own tested purchase and restoration flow.

For scale perspective only, 500 purchases at $19.99 generate $9,995 gross before fees, taxes, refunds, acquisition, support and content costs. One thousand annual subscribers at $24.99 generate $24,990 gross per year before those costs. These arithmetic scenarios are not sales forecasts. Work backward from the amount of editorial time and support the product can sustain.

Apple's Small Business Program currently advertises a reduced 15% commission for eligible, approved participants; applicability depends on the selected terms and storefront. Check the account's actual terms before calculating net revenue. [Apple source](https://developer.apple.com/app-store/small-business-program/)

## Distribution and launch sequence

Start with web links because friends can try them without an app installation. Use the existing studio website to explain the product and direct people to one canonical game origin. Keep that hostname stable: browser-local progress is tied to the origin and does not automatically move between a LAN IP, a preview hostname and a custom domain.

After the web experience is stable, use the existing native project for device testing and TestFlight. Apple supports up to 10,000 external testers and the first external beta build requires review. That is an available channel, not evidence that this app has been submitted or approved. [TestFlight](https://developer.apple.com/testflight/)

For an App Store submission, finish the native experience, accurate screenshots, support contact, privacy disclosures, purchase restoration and accessibility review. Apple's review guidelines require an experience with value beyond a repackaged website; acceptance should not be assumed merely because the wrapper compiles. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) Describe the data actually collected, its uses and deletion process accurately. [Apple privacy review guidance](https://developer.apple.com/distribute/app-review/)

Before charging, complete the repository's existing distribution-rights review for imported dictionaries, semantic content and source packages. The bundled font notices are retained; that does not establish rights for every other asset. Keep provenance and third-party notices with the distributed build. A source-provenance report is a starting point for clearance, not a legal opinion.

## Release decision

Proceed to a small public launch when people can open and complete the promoted games on the intended devices, daily and practice progress survive reloads, known fairness blockers are resolved, the next month is editorially ready, the live hostname is verified, and the selected paid offer has tested delivery and support. Set the exact go/no-go thresholds after the first week's baseline; do not manufacture a universal retention benchmark.

The next concrete milestone is a working friends link plus the 30-day cohort. Commercial billing follows evidence that people want to return.
