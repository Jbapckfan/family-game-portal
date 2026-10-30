# Individual game review workflow

James wants a full gameplay/UI/sharing review of each game, one at a time, with Kimi, Opus and Gemini; DeepSeek only if free access is verified. Preserve reviewer attribution and separate their predictions from James's actual preferences. Keep the overall game count stable unless James approves removal or replacement.

## Preview windows — James's October 30 correction

“you keep opening new chrome tabs, i have 4 open... just try to use 1 or 2”

Keep one preview window and at most two task tabs. Reuse the current game tab for changes and the second tab for a labelled visual example when needed. Inspect existing owned previews before opening anything. Close obsolete previews started by this task; preserve unrelated personal browser windows and the current game's progress.

The current Counterpart launcher is `output/counterpart-review-20261030/show-readable-counterpart.mjs`, running with a PTY so `reload` on stdin refreshes the current tab and retains its browser storage. Use that channel while the process exists. Prior non-PTY launchers had closed stdin and could not be refreshed that way. Do not solve this by repeatedly launching replacement browsers.

The current persistent profile is `output/counterpart-review-20261030/readable-profile`. Preserve it for the next game. The launcher intercepts HTTPS file requests, so it uses no listening port. If a real server becomes necessary, follow the standing local-projects registry/run rules.
