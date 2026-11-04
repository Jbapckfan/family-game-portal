# Visible web favorites and hidden games

Home cards now place Favorite and Hide/Unhide buttons outside their game links. A prominent collection control offers Favorites only and Show hidden. The controls filter Today’s Three, featured games, grouped games and bonus matches without changing daily assignments, records or calendar data. Hidden games remain stored and can be restored.

Every one of the 33 game documents loads `deepseek-runtime/player-tools.mjs`. Its ordinary-flow toolbar sits outside game/React roots and uses 44 px controls. Preferences are boolean `favorite`/`hidden` values under `alford:game-pref:v1:<slug>`. Reads, malformed data, unavailable storage and unverified writes produce visible errors. Changes synchronize through storage events and the `alford:game-preferences` event. Home initialization stays synchronous; it exposes an optional `preferencesReady` promise and derives the module URL from `data-game-base`.

Native contract: initial `window.__ALFORD_NATIVE__.gamePreference` is `{slug,favorite,hidden}`; user changes send `{type:'gamePreference',slug,favorite,hidden}` to the alford message handler. Incoming `alford:game-preference-change` events carry the same flat values and never echo to native. Native delivery itself is verified by the native integration lane, not this browser-only work.

Packaging allowlists include the new shared module and Ringcount’s existing `samples.mjs`. Generated ios/Web resources are deliberately left to the integration owner.

Validation: 15 Node home/preference tests passed. Four isolated browser scenarios passed (Chrome and WebKit at 1280 px and 390 px). Each checks all 33 game toolbars, favorite/reload/filter/game/home round trips, hide/unhide, duplicated featured cards, bonus games, unchanged daily set, quota failures, and the native bridge contract. No page exceptions. Phone card/filter/game screenshots inspected. No listener or personal browser profile was used. Evidence is local at `/private/tmp/MAKER-Codex__web-favorites-20261104/`.

Integration note: this commit intentionally includes the canonical checkout’s approved dirty home icon display and duplicate Sideways-banner removal. Preserve these three complete home files when resolving cherry-pick conflicts.
