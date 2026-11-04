# Alford Daily feedback receiver — local prototype

No hosted resources, credentials, deployment, or audience changes were made. Existing Site ID: `appgprj_6ad77f0216348191a061da38c4a431c4`. Preserve its owner-private policy.

## Supported migration

This uses the supplied Sites Vinext starter unchanged for its Worker entrypoint and `sites()` build integration. `public/` contains the static collection and games. `app/api/feedback/route.ts` adds the API. `.openai/hosting.json` retains the existing Site ID, removes `static`, and declares `d1: "DB"`, `r2: null`. Sites provisions/binds D1 and applies the generated schema-only migration during publication. The generated `dist/server/wrangler.json` includes `assets.directory: "../client"`; the Sites plugin emits hosting metadata and migrations to `dist/.openai/`.

The lightweight Worker ESM starter is unsuitable: its documented artifact contract copies only the Worker module and forbids standalone assets. This supported full-stack build preserves the game files as static assets instead.

## Frontend contract

Send `POST /api/feedback` on the same origin with JSON `{id: note.id, slug: note.gameId, text: note.text}`. UUID `id` is generated once when the local note is created and retained for all retries. Note length is 1–2000 UTF-16 code units. Only these three fields are accepted; local game name, date, mode and client timestamp need not be sent.

New committed record: HTTP 201. Exact retry by the same signed-in user: HTTP 200. Both return `{received:true, receipt:{id, receivedAt}}`. The timestamp comes from the database. Verify the returned id matches the submitted UUID and receivedAt parses as a timestamp before showing a green success check. Preserve local unsent text and id on network/error/unconfirmed responses.

Validation fails with 400, unauthenticated callers with 401, cross-origin writes with 403, incompatible id reuse with 409, wrong content type with 415, oversized bodies with 413, unavailable or unconfirmed storage with 503. Retrying an id with changed text is a conflict: create a new id when submitting a genuinely edited note after an earlier receipt.

The private Sites authentication gateway injects `oai-authenticated-user-id`. No client secret is needed. The API also requires that identity; a service bypass credential alone does not provide it. Do not expose the Worker outside Sites dispatch. No public GET/list route exists. Owner inspection must use authorized D1/admin tooling; no note text is logged or returned in receipt responses.

## Copy into the existing opened Site checkout

Copy the prototype's authored starter/source files, excluding `.git`, `node_modules`, `.sites-runtime`, `.wrangler`, `dist`, `outputs`, and `public`. Preserve the existing source repository and exact project ID. The important additions are `lib/feedback.mjs`, `lib/game-slugs.mjs`, `app/api/feedback/route.ts`, `db/schema.ts`, and generated `drizzle/0000_feedback.sql` plus `drizzle/meta/`. Keep starter `vite.config.ts`, `worker/index.ts`, scripts, package files and config together.

Refresh **all** final static assets into `public/` from the root agent's latest stage-site output, including `games/daily/`. The copied prototype assets are only a snapshot. Root route redirects to `/games/daily/`; every existing game route remains under `/games/<slug>/`. Do not copy credentials, logs, node_modules, or private project documentation into `public/`.

Run the supplied configure/install/build helpers from the target checkout. Run `node --test tests/feedback.test.mjs`, `npx --no-install tsc --noEmit`, and the Sites `build-site.mjs` helper. Do not hand-edit generated dist manifests. Source-sync and publish the exact committed result through the existing Site, preserving audience. No new Site creation is needed.

## Local verification

- Locked starter dependencies installed locally using the Sites helper.
- Drizzle schema migration generated with `npm run db:generate -- --name feedback`.
- Seven unit/integration tests passed using SQLite, including real database reopen, retry uniqueness, conflicts, validation, auth/origin refusal, failure handling, and commit-before-receipt behavior.
- `node tests/d1-smoke.mjs` passed against actual local Miniflare D1: first request 201, retry 200, one stored row, matching database receipt timestamp. It uses synthetic content, a temporary local database, and disposes its emulator afterward.
- Wrangler's documented `d1 execute DB --local ... --file drizzle/0000_feedback.sql` applied the migration to local preview storage successfully. Do not replay that migration into the same local store.
- `npx --no-install tsc --noEmit` passed.
- Sites `build-site.mjs` passed. All 314 copied public files matched built `dist/client` bytes; copied public files total 8,010,831 bytes. Server artifact files total 727,693 bytes.
- No browser/HTTP test of the final Vinext asset routing or hosted D1 was performed. Production acceptance requires an authenticated real POST, receipt verification, retry, and authorized storage inspection after deployment. An owner-private Site does not automatically grant friends access.
