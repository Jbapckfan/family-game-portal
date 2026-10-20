# Alford Daily: portfolio research and app direction

> **Updated collection scope:** the app now includes 14 attributed games (eight ChatGPT, six Kimi). See [Unified collection](unified-collection.md) for the current lineup, source provenance, integration changes, and commercial-release limitations. Earlier six-game choices and projections below remain the original planning record.

Research date: October 20, 2026. This document distinguishes the current NYT product facts from our design recommendations. The proposed games use original rules, puzzle content, presentation, and names; this research is a comparison of play experiences, not a source of puzzle answers or branding.

**Current launch scope:** the iOS app launches with six games: Ringcount and Switchpath as the flagship pair, plus Counterpart, Shortlist, Second Sense, and Sideways. Those six contain 420 prepared boards. Tradeoff and Inbetween remain family-portal classics with 150 additional boards. The web collection can show all eight, for 570 boards total. See the [iOS launch and monetization plan](ios-launch-and-monetization.md) for the app model, StoreKit implementation requirements, ad placement, privacy, and costs.

## What the current NYT portfolio covers

The publisher's current [NYT Games App Store listing](https://apps.apple.com/us/app/nyt-games-wordle-crossword/id307569751) describes eleven named games in the main Games app, including the newer Midi Crossword and Pips. The [NYT Games subscription help page](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/360052272251-New-York-Times-Games-Subscription) lists thirteen across its wider portfolio: those eleven, Connections: Sports Edition, and the separate Crossplay app. Keeping those surfaces distinct avoids treating every NYT game as a feature of one app.

| Game | Core interaction | Design lesson for Alford Daily — our interpretation |
| --- | --- | --- |
| Crossword | Enter intersecting answers from across/down clues. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360052406391-The-New-York-Times-Crossword-Puzzle) | Shared letters let one deduction support another. |
| Mini Crossword | A compact crossword that supports a short session. [Publisher listing](https://apps.apple.com/us/app/nyt-games-wordle-crossword/id307569751) | A small complete experience can be satisfying on its own. |
| Midi Crossword | A daily crossword between the Mini and full Crossword in size. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/the-midi-crossword) | Session length is part of the product design. |
| Wordle | Infer a five-letter word in six attempts using letter feedback. [Publisher listing](https://apps.apple.com/us/app/nyt-games-wordle-crossword/id307569751) | Each action should return information the player can use. |
| Connections | Sort sixteen terms into four shared categories. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/28525912587924-Connections) | Familiar words can support difficult interpretation. |
| Spelling Bee | Form words from seven letters, always including the center letter. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/23675493312404-Spelling-Bee) | Open-ended discovery supports more than one satisfying stopping point. |
| Strands | Trace related words through a grid; a spanning answer names the theme. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/28214352967700-Strands) | A spatial field can make word recognition tactile. |
| Letter Boxed | Chain words using letters on different sides of a square; cover all supplied letters. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/28527193547028-Letter-Boxed) | An easy-to-state restriction can create deep optimization. |
| Tiles | Match visual components of layered tiles and build continuous chains. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360029050872-Tiles) | A collection benefits from a calm, nonverbal change of pace. |
| Sudoku | Fill a grid so rows, columns, and boxes contain digits 1–9 without repetition. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/30467696592148-Sudoku) | Transparent constraints support deliberate deduction and reversible work. |
| Pips | Place dominoes to fill a board while satisfying numerical region constraints. [Rules](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/pips) | One move affecting several constraints creates useful tension. |
| Connections: Sports Edition | Apply the grouping format to sports terms; available through The Athletic and web surfaces. [The Athletic publisher listing](https://apps.apple.com/us/app/the-athletic-all-sports-news/id1135216317) | Specialized knowledge can serve an audience, but is a barrier for others. |
| Crossplay | Take turns making words with letter tiles against another player or an AI opponent. [Publisher listing](https://play.google.com/store/apps/details?hl=en&id=com.nytimes.wordgame) | Social competition is a separate commitment from a daily solo ritual. |

There are also [weekly bonus puzzles](https://thenewyorktimeshelpcenter.helpjuice.com/bonus-puzzles), including Wordle in 1, Connections 3x3, Colorful Strands, Mystery Mini, and Special Crossword variants. These are variations within the portfolio, rather than five additional main-app titles. [Vertex was discontinued](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/28624146433300-Vertex), with its last puzzle on August 29, 2024. NYT documents a [web beta program](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/24174502647444-Beta-Games), but that help page does not establish an additional currently available named beta. This inventory covers the documented recurring digital portfolio, not every historical experiment or print-only puzzle.

## The opportunity for our collection

Our design goal is several distinct mental activities behind one familiar daily interface. Counterpart matches ordered semantic relationships, Shortlist asks the player to choose informative tests, Second Sense adds retrieval, and Sideways adds coupled spatial word reasoning. Ringcount and Switchpath broaden the six-game iOS launch with rapid logic that does not require vocabulary. Tradeoff's letter swaps and Inbetween's pair insertion remain part of the wider family collection.

This is a product hypothesis, not proof of commercial demand or a claim that a publisher will acquire the games. The defensible value will come from enjoyable rules, excellent puzzles, reliable daily delivery, and evidence that players return voluntarily.

### Second Sense: one spelling, two meanings

Show five noun definitions and five verb definitions in separate banks. The player pairs a noun and a verb clue, then types the same written word that fits both. For example, *bark* can name a tree's outer layer or describe a dog's sound; *fence* can be a boundary or mean dealing in stolen goods; *wind* can refer to moving air or turning a mechanism. The wording must say “same spelling”: pronunciation can change between senses.

Five answers make a daily board. Difficulty comes from matching meanings and retrieving the word, with familiar answers and precise definitions. A first-letter hint also reveals the answer length. Accept legitimate curated alternatives. Do not use automated semantic similarity as the judge.

The distinction from Counterpart is the player action: Counterpart recognizes the same relationship between two pairs, while Second Sense retrieves one word that satisfies two meanings. Do not require literary terminology, obscure dictionary senses, or a hidden regional convention to solve a board.

### Sideways: four words coupled by five rotating rows

Show five horizontal strips of four letters each, plus four clues for the vertical five-letter answers. A player rotates any row left or right; that move changes all four columns at once. The board finishes when all four clued words read vertically.

This gives the collection a spatial manipulation game with word clues. Unlimited reversible moves preserve experimentation; an optional check or hint should report useful progress without introducing a dead end. Keyboard controls and direct row buttons provide alternatives to swiping.

There are only `4^5 = 1,024` row-offset configurations. Enumerating them can verify the intended arrangement and detect duplicate configurations. Generate a solved grid first, then scramble it. Repeated letters can make several offsets visually identical, so uniqueness must be measured on the visible board or equivalent offsets must be canonicalized. Structural uniqueness does not prove a clue has only one reasonable interpretation; editorial review is still necessary.

### Ringcount: four cuts, four equal sums

Show twelve fixed numbers around a circle. The player places exactly four cuts in the gaps so the four resulting contiguous arcs each sum to the displayed target. Tapping a cut again removes it; no numbers move. This adds quick mental arithmetic and partitioning without a keyboard or a long instruction screen.

An independently enumerated example has clockwise numbers `5, 4, 6, 9, 6, 7, 2, 5, 1, 8, 3, 4`, with target 15. Its unique cut set is after positions 3, 5, 9, and 12: `5+4+6`, `9+6`, `7+2+5+1`, and `8+3+4`. There are only 495 four-cut sets on a twelve-number ring, so every daily board can be exhaustively certified. Vary group lengths and include plausible partial groups; equal-length sections would make the presentation predictable.

### Switchpath: a route with a changing direction of comparison

Trace one orthogonal route through all sixteen cells, starting at S and ending at E. Successive numbers must go higher, lower, higher, lower. No cell can be visited twice. The next required comparison stays visible. Undo is unrestricted, and tapping an earlier path cell backs up to it.

This example has one complete route under those rules:

| | | | |
| --- | --- | --- | --- |
| **1 S** | 11 | 6 | 15 |
| 5 | 10 | 8 | 4 |
| 2 | 13 | 3 | 12 |
| **16 E** | 7 | 14 | 9 |

The route values are `1 → 5 → 2 → 13 → 10 → 11 → 6 → 15 → 4 → 8 → 3 → 12 → 9 → 14 → 7 → 16`. An exhaustive search found exactly one completion. Under the implemented rule that E is reserved for the final step, five positions offer more than one locally legal forward option, giving the board decisions beyond simply following highlighted cells. Production validation counts full routes rather than merely checking that an authored route works.

Both games target roughly 20–120 seconds after learning the rules; that is a design target awaiting playtesting. A limited title/mechanic search found related traditions: [Rondo](https://wittora.com/en/games/rondo/) places numbers around a ring to match bridge sums, while [Math Logic Path](https://mathpuzzle.boogdan.com/) includes descending and alternating-parity routes. The proposed fixed-ring partition and alternating-magnitude full-coverage route are distinct from the rules described on those pages. This comparison does not establish worldwide novelty or trademark availability.

## What “challenging and always solvable” should mean

Every published board must have a verified completion under its actual rules. If a game limits information gathering, its validator must establish a winning decision strategy within that limit for every possible hidden answer. A guess-limited game can still be lost by a player's choices; the promise is that the board supplies a fair route to a win.

Use a release pipeline with four separate checks:

1. **Content validity:** allowed characters, answer lengths, definitions, duplicate detection, and accepted alternatives.
2. **Rule validity:** run the real engine on the authored solution and verify that hints, undo, and legal moves cannot make the puzzle impossible.
3. **Solver certification:** count solutions or certify the relevant strategy; store the result with an immutable puzzle ID and content version.
4. **Blind playtesting:** check that the intended reasoning is understandable and calibrate difficulty using actual solve behavior.

Finite prototype libraries will eventually repeat. A commercial daily collection needs a continuing editorial schedule, a reserve of reviewed boards, and a correction process that does not silently change a puzzle someone has already started. Treat unfamiliar vocabulary and accidental ambiguity as editorial defects, not as evidence that a board is difficult.

## Future app and monetization plan

Build one Alford Daily iOS app containing the six launch games, with Ringcount and Switchpath first. Keep the game engines, puzzle data, shared interface, progress storage, and purchase entitlement separate. The web prototypes are a useful foundation; store distribution, durable purchase restoration, and an ongoing content service require their own implementation and verification. The two earlier games remain accessible through the family portal.

**Permanent ad removal:** use one purchase for the collection. Apple's [non-consumable purchase type](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types) is bought once and does not expire. Google's [one-time products documentation](https://developer.android.com/google/play/billing/one-time-products) explicitly includes an ad-free app as a non-consumable example. A local preference toggle is not a purchase system: derive access from verified store transactions, handle refunds/revocation, and provide a clear restoration path. Google's [purchase lifecycle](https://developer.android.com/google/play/billing/lifecycle/one-time) requires completed purchases to be verified and acknowledged; pending purchases must not grant the entitlement prematurely.

**Ads at natural breaks:** begin with a restrained, frequency-capped placement after a completed puzzle and its result screen. Never interrupt a clue, a move, or answer feedback. [AdMob's interstitial guidance](https://developers.google.com/admob/ios/interstitial) recommends natural transitions; [Google Play's policy](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en_sg) prohibits unexpected interstitials during gameplay and at the beginning of a level. Preserve instant access to today's puzzle. Keep hints useful on their own rather than manufacturing frustration to sell a recovery.

**Prepare a real app experience:** retain offline play for downloaded puzzles, reliable progress, accessible input, responsive layouts, purchase restoration, and a cohesive daily hub. Apple's [review guidelines](https://developer.apple.com/app-store/review/guidelines/) call for more than a repackaged website and prohibit copying another app's work. Our recommendation is a single distinctive collection with original content, rather than multiple near-identical submissions. Before adding an ad SDK, decide the intended age audience and the appropriate privacy and consent design.

Choose pricing and ad frequency after observing retention, completion rates, hint use, and player feedback. The [iOS plan](ios-launch-and-monetization.md) sets out initial price experiments, the current Apple fee structure, and the additional content needed for a 90-day reserve. There is no revenue or acquisition forecast. No ads, billing, purchase buttons, or simulated entitlements are implemented by this document.
