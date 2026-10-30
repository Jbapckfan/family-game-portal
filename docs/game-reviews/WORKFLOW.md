# Individual game review workflow

James wants a full gameplay/UI/sharing review of each game, one at a time, with Kimi, Opus and Gemini; DeepSeek only if free access is verified. Preserve reviewer attribution and separate their predictions from James's actual preferences. Keep the overall game count stable unless James approves removal or replacement.

## Preview windows — James's October 30 correction

“you keep opening new chrome tabs, i have 4 open... just try to use 1 or 2”

Keep one preview window and at most two task tabs. Reuse the current game tab for changes and the second tab for a labelled visual example when needed. Inspect existing owned previews before opening anything. Close obsolete previews started by this task; preserve unrelated personal browser windows and the current game's progress.

The former Counterpart launcher was `output/counterpart-review-20261030/show-readable-counterpart.mjs`. It has been superseded by the reusable controller below. Prior non-PTY launchers had closed stdin and could not be refreshed. Do not solve this by repeatedly launching replacement browsers.

The current persistent profile is `output/counterpart-review-20261030/readable-profile`. Preserve it for the next game. The launcher intercepts HTTPS file requests, so it uses no listening port. If a real server becomes necessary, follow the standing local-projects registry/run rules.


## Reusable controller

The current controller is `node scripts/review-preview.mjs shortlist`, using the same Counterpart readable-profile storage, with a PTY. Commands on its existing stdin:
- `game shortlist` (or another exact catalog slug): navigate the existing game tab.
- `reload`: update that tab from current source, retaining saved progress.
- `sample output/<review-folder>/<image>.png`: reuse/create only the second tab for a labelled automated-test image example.
- `close-sample`: return to one tab.

At the start of a new review, use `game <slug>` on the existing process. Do not start a second controller. The initial transition required closing the previous reload-only controller and reopening its saved profile; future reviews can now navigate without replacing the window. A separate native Chrome accessibility binding may select James's personal New Tab window rather than this isolated profile, so do not navigate that unrelated window.
