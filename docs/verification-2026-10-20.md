# Alford Daily release verification — October 20, 2026

## Scope

The six-game iOS launch collection is Counterpart, Shortlist, Second Sense, Sideways, Ringcount, and Switchpath. The last two are the flagship pair. Tradeoff and Inbetween remain unchanged family classics in the eight-game web collection.

The launch includes 420 prepared boards across six games; the complete web collection has 570. Counterpart and Second Sense each have 30 boards and therefore repeat sooner than the four 90-board collections. These totals do not represent 420 unique days for every game.

## Executed web checks

All six games passed their Node engine/content tests and syntax checks after the gameplay fixes. The shared shell also has regression coverage for daily/practice separation, storage failures, persisted terminal results, date rollover, sharing, and optional native messages. Shortlist, Sideways, and Switchpath generator checks passed.

Every game was completed through its actual browser interface. The checks exercised incorrect choices, hints, refresh/resume, scoring, and keyboard interaction where relevant. Specific regression checks included Shortlist's focused-letter Enter action and retained hint text, Second Sense's normalized typed answers, Sideways' wrong-check feedback, Ringcount's correction of a full incorrect cut set, and Switchpath's illegal moves and early-end rejection.

All six game layouts were inspected inside 320-pixel phone frames. Document scroll width matched viewport width for each game. Sideways' long clue wrapping and Counterpart's word-button sizing were corrected during that pass. The home screen also passed a 390-pixel phone-frame check; its About dialog opened, closed, and returned focus correctly.

These checks establish the observed interactions, not full accessibility certification or a physical-device test.

## Puzzle validation

| Game | Validation performed | Limit of the claim |
| --- | --- | --- |
| Counterpart | Authored relationship mappings and all answer-bank ordered-pair combinations, including partially solved states | Natural-language ambiguity still needs independent editorial and player review |
| Shortlist | Every possible secret in every board has a distinguishing strategy within three scans: 1,080 answer paths | Poorly chosen scans can use the budget without identifying the answer |
| Second Sense | Authored noun/verb pair mappings, accepted words, and partially solved states | Dictionary meanings do not constitute a proof against every alternative interpretation |
| Sideways | All 1,024 row orientations for each of 90 boards: 92,160 arrangements | Exactly one solution under the supplied clue-answer set |
| Ringcount | All 495 four-cut placements for each of 90 boards: 44,550 placements | Exactly one valid cut set per supplied board |
| Switchpath | Exhaustive legal-path search and 25,229 nonterminal hint-recovery states | Exactly one complete route per supplied board; undo/reset/hints allow recovery |

The games have no mandatory speed timer. A revealed answer does not count as a solved daily. Practice does not add to the daily completion count.

## Native project checks

The portable structural validator and bundle hash check passed for 24 Swift source files, two Xcode targets, two shared schemes, 20 XCTest methods, and 90 bundled runtime files. Independent source review identified and fixed stale statistics overwriting native totals and queued messages repopulating progress after a reset.

The GitHub workflow `iOS app verification` compiles the app and runs native unit tests plus a real WKWebView smoke test on a macOS iPhone simulator. That smoke test loads all six games using the production custom scheme handler and checks JavaScript module loading, the native bridge, styling, and persistent same-origin browser storage. See the workflow run for the commit being evaluated; a structural check alone is not evidence of successful Swift compilation or XCTest execution.

Physical-device interaction, VoiceOver, local StoreKit transactions, signed distribution, and App Store review remain separate release gates. The ordinary build has commerce disabled and contains no advertising SDK.

## Publication and portal integration

The private Alford Daily site was published successfully at https://alford-daily.jbapckfan.chatgpt.site. Counterpart and Shortlist also retain their standalone private sites.

Portal catalog checks preserved all 26 original root cards and all 22 original legacy cards, in order, while adding the six new games. The focused upload uses the existing remote Git tree as its base, preserving repository files absent from the local snapshot. Original Tradeoff and Inbetween runtime files are unchanged.

The live NAS portal still needs the documented fast-forward pull and targeted container restart. The connected Mac is offline, so this release does not claim that the LAN deployment was refreshed. See `docs/integration.md` for deployment instructions.
