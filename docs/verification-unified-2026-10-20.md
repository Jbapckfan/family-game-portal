# Unified collection verification — October 20, 2026

This report concerns the 14-game collection: eight ChatGPT games and six Kimi games. The earlier six-game iOS report is historical and does not establish this release's native result.

## Completed source checks

- 258 original-game engine, content, application-persistence, and shared-shell checks passed after adding the developer labels and classic-game native adapters.
- 24 named Kimi tests passed, including saved-state validation against all 3,362 supplied completed solutions, recoverable Morph/Circuit moves, Cairn rack/transition restoration, Quartet hints/final misses, Hunch feedback reconstruction, Tangle scoring, Central daylight-saving boundaries, visible midnight rollover, first-terminal finality, practice isolation, and quota-failure fallback.
- Four unified-catalog checks and ten bundle/containment/structural fixture checks passed.
- TypeScript and the production Vite build passed.
- Native resource staging and exact SHA-256/file-set parity passed for 14 game documents and one shared runtime: 148 runtime files including the restored full font notices.
- Project validation passed: 24 Swift files, two targets, two shared schemes, 24 XCTest methods.
- The uploaded original ZIP and all 144 original file hashes match the provenance record. Catalog IDs, credits, and counts agree across web and native metadata.

## Browser checks in progress

The unified catalog loads all 14 entries, applies the creator filter, and preserves the eight existing games' saved results. All six imported screens and the two newly bundled classics fit 320-pixel phone frames without horizontal document overflow. Visible developer labels appear in the catalog and game views. Morph's touch letter picker and undo action work; Hunch accepts a complete daily solve through its phone keyboard. Cairn restores and advances completed levels.

The final browser pass and actual macOS workflow result will be recorded here before handoff.

## Native verification

Pending the new private macOS CI run. The 24-test suite includes a real offline WKWebView pass across all 14 games, validated native progress, titles, developer labels, rendered boards, persistent same-origin storage, and resource-containment checks. Structural validation alone is not a native compile or runtime pass.

## Release boundaries

This integration does not create a signed device build, TestFlight release, App Store listing, active ad account, or live purchase product. The NAS cannot be updated through the currently offline Mac connection; repository/source completion and the hosted private web collection are separate from a live NAS deployment.

Original dictionary provenance and full semantic editorial review remain commercial-release work. The bundled fonts' embedded OFL metadata and complete matching official notices are documented in `sources/kimi/font-provenance.md`.
