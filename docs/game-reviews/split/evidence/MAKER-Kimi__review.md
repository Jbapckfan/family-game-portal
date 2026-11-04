**Defects**

- **The first clue permits a plausible, rack-valid alternative.** `GENIUS` + `RECORD` uses `G,E,N,I,U,S` and `R,E,C,O,R,D`, satisfying the two Rs and two Es, and leaves exactly `A,L,O,T`. A genius can reasonably be “sharp,” yet `checkPreview()` rejects this as only `1 of 2`. Optional, counted help should not be necessary to resolve that ambiguity. Use a more identifying clue, such as “It can be sharp; you hold it to stay silent.” The second clue’s “break a record” reading is fair.

- **Focus is reset excessively.** Every playing-state `update()` in `app.mjs` rerenders the controls and focuses `#preview-board`, including after row selection, definition display, and button-based tile entry. Keyboard users consequently lose their place in the Tab order. The newly displayed definition is not reliably announced either—the status only says that help was shown. Preserve the initiating control where appropriate; reserve board focus for direct letter entry and explicitly expose the definition to assistive technology.

- **Arrow-key row changes lack audible confirmation.** Up/Down calls `update()` with an empty message, then focuses the generically labelled board. The live counter does not identify the active row, so screen-reader users receive no reliable indication of which row now receives letters. Announce “Word 1/2 selected,” optionally with its clue.

- **Invalid-save reporting is inaccurate.** Structurally invalid or oversized saves leave `saved=true`, producing “Saved on this device” before the fresh state has actually been written. Malformed JSON instead enters the storage `catch` and reports “Saving is unavailable,” even when storage works. Separate parsing/validation failures from storage failures and do not claim the replacement state is saved until `setItem` succeeds.

- **Preview controls omit `touch-action: manipulation`.** Tiles, slots, and row controls therefore retain double-tap-zoom behavior during rapid touch entry. Add it to these preview controls while retaining pinch zoom.

No terminal-validity or share-spoiler defect is apparent: restoration enforces unique tiles and valid terminal answers, both answers are checked together, and share/fallback text contains only status and counts. The single preview also uses a separate save key and sample ID.
