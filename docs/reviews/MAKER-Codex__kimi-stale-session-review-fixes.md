# MAKER-Codex — Kimi stale-session and Morph assistance fixes

October 29, 2026. Scoped response to Kimi K3.1's stale-tab finding and Opus's Morph route-assistance finding. Original author attribution remains Kimi. No bank, selector, calendar, native-copy, dependency-install or shared imported-runtime edits.

## Reproduction and fix

Before the fix, two independently loaded instances of the actual Hunch hook shared storage. A submitted `drain`; B, holding the initial state, typed `p`. The assertion expecting B to retain `['drain']` failed with actual `[]`. This reproduces lost progress without substituting a model of the hook. Tests use real React roots/effects, JSDOM's DOM boundary, production storage/restore/engine code, separate module caches per tab, and original bundled dictionary bytes. The harness loads Vite raw-text imports from disk.

All six hooks now use a Kimi-local daily-session guard:

- Check actual persisted day and statistics bytes before every exposed action and progress write; validate changed records through existing restore functions. Adopt a changed valid round and discard the triggering stale input.
- Listen for storage/focus notifications; protect inputs even when notifications have not arrived.
- Write result statistics only inside an accepted progress commit. Adoption does not run finishing actions or award another play/completion. A conflict inside the first-play checkpoint aborts the remainder of that action.
- Preserve the first valid terminal record against stale input/effect writes. Terminal detection uses validated records; malformed `finished: true` data cannot lock out saving.
- Recheck Cairn's delayed level advance and cancel pending callbacks when restoring an external round.
- Keep Tangle playable after gold; later words persist without awarding completion again.
- Continue in memory if reads are blocked, including when writes would succeed. Quota failures remain playable. Valid external adoption replaces stale in-memory fallback.

Record keys and existing progress field meanings are unchanged. Stable action wrappers retain callback identities. Calendar and practice-selection functions are untouched.

## Morph assistance disclosure

`medalFor` and `buildMorphShare` accept an optional hints-used argument, preserving existing callers. Medal thresholds, win status, completion/streak rules and give-up behavior remain unchanged. Assisted medal labels include `Assisted`; visible results explain `Assisted · route shown during play`; copied shares add `💡 Assisted · route shown`. The indicator uses the existing persisted hints count.

## Verification

`npm test` in `packages/kimi-pebbles`: 116 tests passed, zero failed/skipped. This includes 45 new real-hook scenarios:

- Seven per game: stale draft/hint input; completed-round adoption with exact terminal-save preservation and single statistics award; storage-event adoption and malformed external input; blocked reads with writes allowed; quota failure; an external save arriving between state update and persist effect; malformed terminal flags followed by successful completion.
- Cairn delayed-callback conflict.
- Hunch conflict inside the first-play checkpoint after the outer input guard has run.
- Morph hint → legal route completion → real result dialog → Share button, verifying visible assistance and captured clipboard text. Clipboard is mocked; no actual user clipboard write.

Completion cases use actual actions: Cairn submits every rack; Morph follows its legal ladder; Hunch submits the answer; Tangle follows adjacent paths to gold then accepts another word; Circuit follows its covering chain; Quartet submits each group. Blocked/quota cases also finish through actual actions.

Existing focused action-only scoring tests now explicitly inspect computed state statistics; real-hook tests verify persisted statistics after effects. No fake React effect is presented as persistence evidence.

Strict TypeScript source check passed using the existing TypeScript 5.9 installation, bundler resolution, ES2022, React JSX, JSON imports, the existing `@/*` alias and Vite client types. Original project-reference build configs are incomplete; this is a source type check, not a claim that the original `npm run build` passed. Dependencies were reused through an ignored local node_modules symlink; nothing was installed.

## Bounds and integration

Root owns actual browser multi-tab QA and selector integration. No browser/server or provider was launched. Tests cover stale controllers, delayed storage notifications and injected conflicts at both write boundaries. LocalStorage has no cross-process compare-and-swap transaction; this does not claim serialization of two OS processes executing the read/write instructions at the exact same instant. Progress and aggregate statistics remain separate keys, as before.

Production files: six hooks; new `shared/useDailySession.ts`; Kimi-local `shared/integration.ts`; `morph/MorphPage.tsx`; `morph/MorphWinModal.tsx`; only lower medal/share functions of `morph/engine.ts`. Root's imports/daily/practice selectors should merge independently.
