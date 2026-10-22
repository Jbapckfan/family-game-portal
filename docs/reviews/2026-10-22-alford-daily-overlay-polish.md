# Alford Daily — dialog and input polish, October 22, 2026

Alford Daily remains the standalone 32-game Word Games product, separate from Family Portal and SpellSpark. This second local pass resolves the overlapping Statistics/result dialogs identified in the [first reliability review](2026-10-22-alford-daily-reliability.md), improves keyboard operation, and corrects concrete Morph letter-picker layout issues.

## Source and preservation

- Base for this pass: `cc44539630f5745ebde65d41907e2ce1fabafa0e`, the completed local reliability commit. Original upstream source: `6b5a09b4896aa606e6b668aaab2f917786d81911`.
- Isolated checkout: `/Users/jamesalford/Documents/Codex/2026-10-22/task-3/alford-daily-review`; branch `review/alford-daily-reliability-2026-10-22`.
- The new package's `LOCAL-REVISION.txt` identifies its exact final local commit. Its incremental patch applies after the first review; a separate combined patch applies to the original upstream base.
- The first `Alford-Daily-Local-Review-2026-10-22.zip` is immutable: 4,354,581 bytes, SHA-256 `35c5d02fbd6d69fc03c714a925e9f3884eb32a9bac0789a1c55d56fc00b76714`.
- This pass preserves game rules, scoring, puzzle IDs, schedules, word banks, save schemas/namespaces, historical progress, creator credits, source originals, commerce and signing configuration. Earlier reliability fixes remain in the branch.
- No push, merge, deployment, domain change, publication, payment activation or external message occurred. Testing used only this task's simulator and derived-data directory.
- GPT-6 Astra implemented bounded keyboard/pointer changes and independently reviewed the coordinator and six page integrations. Its direct real-dialog review passed 17 scenarios. No Opus review is claimed.

## Corrected behavior

| Problem | Result |
| --- | --- |
| A completed Morph daily could open Statistics and then delayed results over it; the DOM contained two open modal dialogs. All six Kimi pages had the same independent state/timer pattern. | Cairn, Morph, Hunch, Circuit, Tangle and Quartet use one shared Help/Statistics/result coordinator. Choosing a dialog cancels the pending automatic result popup. Closing Statistics does not unexpectedly open results; See results remains available. |
| Result timers could outlive hidden/interrupted pages or round changes; practice can randomly select the same puzzle number again. | Hidden and page-hidden completions wait for resumption. Day/mode/puzzle changes discard old popups. Explicit practice/daily transitions reset the coordinator even when a practice ID repeats. Timers and listeners clean up on unmount; existing delay lengths are preserved. |
| Controlled Radix dialogs lacked a Radix Trigger, so default dismissal could lose keyboard focus. | Escape/close restore the initiating control if usable. Automatic results fall back to See results; first-visit Help and removed controls fall back to a stable game focus target. Closing a dialog does not steal focus from its replacement. |
| Global Enter handlers in Cairn, Morph, Hunch and Tangle intercepted focused controls. | Enter on buttons, links and form controls is left to the control. Body submission and letter typing still work; open dialogs block underlying game shortcuts. |
| Morph's custom letter palette lacked shared dialog focus containment and Escape handling. | It now uses the existing accessible dialog primitive with a label/description, contained keyboard focus, Escape dismissal and return to the edited letter. Its letter choices/actions are unchanged. |
| The collection stylesheet overrode palette top padding, placing the close control over the first letter row. At 320 pixels, six columns made letters only 37 pixels wide. | Scoped top spacing separates close and letters. Five columns below 360 pixels and six above preserve at least 44-by-44-pixel controls in measured 320- and 390-pixel layouts, without horizontal overflow. |
| Tangle submitted a word on pointer cancellation because cancellation shared its pointer-up callback. | Cancellation ends the gesture without submission. A normal completed drag still submits once; the selected path remains available. |

Distinct game identities, colours, boards and contributor labels remain intact. No new daily format or collection redesign was introduced.

## Exact final verification

| Check | Result | Evidence beside checkout |
| --- | --- | --- |
| Web/game/script suite | **479 passed, zero failed** | `polish-web-final.log` |
| Kimi suite | **56 top-level tests passed, zero failed** | `polish-kimi-final.log` |
| Real React/Radix overlay scenarios | **17 passed**, inside one of those 56 wrapper tests | Same log, explicit child TAP output |
| Real Morph palette DOM cases | **3 passed**, already included in those 56 | Escape/opener focus, letter choice/shortcut isolation, Tab/Shift-Tab containment |
| Production build | TypeScript/Vite passed; six wrappers and 19 shared assets staged | `polish-build-final.log` |
| Native web parity | **264 files**, 32 entries and two shared runtimes, matching SHA-256/file sets | `polish-ios-sync.log` |
| Project validation | 24 Swift files, two targets, two shared schemes, 29 XCTest methods | `polish-ios-validate.log` |
| Native final-bundle XCTest | **29 passed, zero failed**, including offline WebKit launch of all 32 games | `native-polish-delivery.log`, `AlfordDaily-polish-delivery.xcresult` |
| Standalone staging | **294 runtime files**, only Alford Daily | `polish-stage.log` |
| HTTP verification | 32 games, 8,001 prepared records, **293 exact assets/launch routes** matched | `polish-http-final.log` |

Do not add nested counts twice. The 13 new keyboard/pointer cases execute production event callback code with fixture actions. Overlay and palette tests use real React/Radix portals and focus scopes. The overlay harness fixtures engines/boards/confetti, so these are not full gameplay end-to-end tests. Actual built-page checks supplement them below.

The 17 overlay cases cover all six Statistics-before-delay races, Escape/return focus, manual results and no automatic reopening, automatic-result fallback focus, hidden completion, pagehide/pageshow interruption, day change, repeated practice IDs, manual/first-visit Help, same-event visibility/day rollover (unfinished and completed next day), and replacement-dialog focus.

Astra caught a Node 26 verification issue: inherited `NODE_TEST_CONTEXT` could let a nested runner exit successfully without executing its helper. The wrapper now removes it, requests TAP output, and asserts all 17 cases executed and passed. Empty output cannot count as success. Red reproduction logs and the independent direct review log are included in evidence.

The first pass's 15 launcher unit tests, six HTTP-verifier unit tests, 960 future daily selections and deterministic content-generation checks are documented in its preserved report. They were not rerun for this UI-only pass; their source/content inputs are unchanged. The HTTP verifier itself was rerun against this pass's exact files.

Native execution used Xcode 27.1, iOS 27.0 and iPhone 18 Pro simulator `18B4613E-5670-4E23-810A-3F88FD501EC0`, `../AlfordDailyDerivedData`, and command-line `CODE_SIGNING_ALLOWED=NO`. Other simulators and global Xcode selection were left alone.

## Browser observations and limits

Before the fix, Morph Statistics and Route revealed were simultaneously open. With the rebuilt app, switching from practice to an already-completed daily and immediately choosing Statistics left only Statistics after the result delay. Escape restored its button focus; Enter reopened it. Morph's selected letter opened the palette with Enter, Escape restored that letter's focus, and choosing B updated the editable letter without submitting a rung. Tangle's focused Statistics button also activated with Enter without submitting a word.

Measured final Morph palette at **320 × 568**: dialog 296 × 410, smallest control 44 × 44, five columns, no close/letter overlap or horizontal document overflow. At **390 × 844**, six columns fit; the spacing correction measured a 366 × 354 dialog and 44 × 44 minimum control without overflow. Screenshots were visually inspected. This is focused responsive coverage, not whole-collection accessibility certification.

Some automated reload/navigation attempts during preview-bundle swaps produced a dynamic-module fetch error despite the local server returning those assets. The visible Reload game control recovered every observed failure; no save was cleared. Exact HTTP checks and all 32 native offline launches passed. The cause of this intermittent in-app-browser navigation failure is not established. Recheck repeated cold/warm navigation in ordinary Safari/Chrome on the eventual release origin; this report does not claim clean browser-reload coverage or label it a confirmed game defect.

No physical-device, VoiceOver, zoom, reduced-motion, payment, external-hosting or full browser-matrix certification was performed. Pointer cancellation has callback regression coverage, not a physical touch-interruption run. Existing dictionary-chunk and dependency-advisory notices remain; no security remediation was attempted. `jsdom` is a pinned development-only test dependency.

## Launch and reproduce

The staged directory is `../preview-polish-delivery`. From the checkout root:

```sh
npm --prefix packages/kimi-pebbles test
npm --prefix packages/kimi-pebbles run build
node scripts/sync-ios-web.mjs
node scripts/sync-ios-web.mjs --check
python3 ios/scripts/validate_project.py
node --test --test-isolation=none games/*/tests/*.test.mjs games/*/*.test.mjs scripts/*.test.mjs
python3 scripts/open-preview.py ../preview-polish-delivery --port 18765
```

The extracted ZIP contains `open-preview.py` and `web/`; run `python3 open-preview.py web --port 18765`. Use the same browser/origin to retain local progress. The launcher is local-only, refuses occupied ports and does not support direct `file:` loading. It creates no live friends URL. Native entry: `ios/AlfordDaily.xcodeproj`, scheme `AlfordDaily`.

## Updated commercial and gameplay roadmap

The first review's modal-coordination follow-up is completed for all six Kimi games. The highest-value next work is:

1. **Clear content rights and define fair vocabulary.** Preserve Kimi/Claude provenance notes. Resolve imported-list permission before commercial distribution. Human-review required paths, proper names (the observed Morph route included SEAN), obscure mandatory words and ambiguous categories. Do not silently substitute a dictionary: an approved replacement needs whole-bank solvability checks and a published-ID/save migration plan.
2. **Use a structured free beta to select the strongest introduction.** Keep all 32 games available. Collect voluntary feedback on comprehension, completion time, hints/reveals, rejected common words, favourite games and repeat visits. Test a proposed three-game introduction with users before changing any daily default. This pass makes no such change.
3. **Improve teaching within each distinct game.** Use beta evidence to select a concise worked example and clearer failure feedback where players struggle. Judge difficulty through human play, including memory timing and obscure words; machine solvability alone does not establish enjoyment. Preserve individual visual identities and model attribution.
4. **Specify the paid collection before implementing billing.** Define included games/archive/content period, update cadence, support and restoration, then test willingness to pay for that concrete offer. Keep `PurchaseManager.current` disabled until an approved entitlement design exists. The debug Remove Ads item is not Collection One. No price or revenue claim is validated here.
5. **Complete trust checks on one standalone release origin.** Verify phones, VoiceOver, keyboard-only play, interrupted sessions, repeated navigation and saves across original/shared/Kimi runtimes. Preserve progress before changing origin. Gate each exact release on rights/editorial approval, deterministic solvability, actual upcoming selector checks, matching bundle bytes and native launch tests.

These are recommendations, not authorization to deploy, replace content, change the daily default or enable payments. Remaining launch work includes rights/editorial clearance, real-device/accessibility coverage, ordinary-browser reload investigation, a stable hosting/save plan and a defined commercial offer. No authorized implementation action is currently blocked.
