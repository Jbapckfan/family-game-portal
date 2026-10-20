# Daily word games in the family portal

Tradeoff and Inbetween appear as featured games in the active root `index.html` catalog. They also have relative links in the older `games/index.html` catalog. The existing game cards and catalog behavior are retained.

## Runtime paths

| Item | Repository path | Portal URL path |
| --- | --- | --- |
| Portal home | `index.html` | `/` |
| Tradeoff | `games/tradeoff/index.html` | `/games/tradeoff/` |
| Inbetween | `games/inbetween/index.html` | `/games/inbetween/` |

Both cards use HTML and CSS thumbnails, so the portal needs no additional thumbnail downloads. The root catalog's Surprise Me and Continue Last Game features discover the added cards automatically.

Tradeoff's runtime is flattened from its original `dist/` directory into `games/tradeoff/`. Its application modules, 90-board puzzle collection, local fonts and licenses, icon, manifest, tests, authored puzzle generator, and development documents are all included. Its asset paths are relative, and its web manifest sets `id`, `start_url`, and `scope` to `./`. Footer links point to `../../` for the portal and `../inbetween/` for the companion game. The original standalone Site's `.git` and `.openai` directories are not part of this package.

## Rules

Inbetween is similarly flattened into `games/inbetween/`, with its 60-board collection, 174-transformation editorial bank, fonts and licenses, generator, all tests, and development documents. Its runtime assets are relative. When served beneath `/games/inbetween/`, its footer points to the family catalog and the sibling Tradeoff game. The standalone Site's owner-private access does not apply to these self-contained NAS files; they use the portal's existing audience.

**Tradeoff:** Every starting word is one letter away from its clue answer. Trade two letters between unlocked positions, including within a word. Correct words lock. All supplied boards conserve letters and have a five-swap solution. Hints and undo are available, and revealed puzzles are recorded separately from wins.

**Inbetween:** Six four-letter words share a bank of six two-letter tiles. Insert a tile at any position in a word to form its six-letter clue answer. Keep both the original letters and the inserted pair in order, and use each pair once.

## Checks

From the repository root:

```sh
npm --prefix games/tradeoff test
npm --prefix games/tradeoff run check
npm --prefix games/inbetween test
npm --prefix games/inbetween run check
bash -n sync-to-nas.sh
```

To regenerate Tradeoff's static puzzle collection:

```sh
npm --prefix games/tradeoff run generate
npm --prefix games/tradeoff test
```

Game-source checks and local asset-resolution checks verify the packaged files. They do not verify a live NAS deployment. The original standalone browser-verification notes are retained separately in `games/tradeoff/docs/verification.md`.

### Integration verification — October 20, 2026

- Tradeoff's 13 engine tests and four puzzle-content tests passed after the import paths were adapted.
- Application, engine, puzzle collection, and generator syntax checks passed; `bash -n sync-to-nas.sh` passed.
- Running the adapted generator reproduced the original 90-board collection byte-for-byte at the flattened `puzzles.mjs` path.
- Twelve runtime asset and module references resolved inside `/games/tradeoff/`; the manifest's identity, start URL, and scope resolved to that same directory.
- The existing 24 root-catalog cards and 20 legacy-catalog cards remained byte-for-byte unchanged. Each catalog received two new cards.
- The sync script's sole change adds root `index.html` to its existing rsync file list.
- Inbetween's 24 engine, six content, and four application-persistence tests passed in both the standalone layout and the flattened portal layout. All 3,840 partially completed board states finished successfully.
- Standalone Inbetween was browser-tested for a full daily, previews, wrong attempts, hints, reveal/reload/restart, statistics, clipboard fallback, second-tab synchronization, and small-phone layouts. See `games/inbetween/docs/verification.md`.
- A local portal preview showed all 26 root cards, opened both games at their nested paths, and verified the game-to-game and return-to-portal links. The existing games' assets were not part of this focused preview; their source cards and files are preserved in the repository base tree.
- No connection to the live NAS was available. The GitHub source update and a local browser preview do not establish a live NAS deployment.

## NAS deployment

The checked-in Docker configuration mounts the root `index.html` as `/srv/index.html` and `games/` as `/srv/games`. Caddy serves `/srv` on container port 80, exposed at NAS port 8080. A GitHub commit is a source backup; the NAS requires its own update.

From a device on the home network:

```sh
ssh Jbapckfan@192.168.1.155
cd /volume1/docker/family-game-portal
git status --short
git pull --ff-only
docker compose restart game-portal
```

Review local changes before pulling. If Git reports conflicting work, preserve it and resolve the conflict instead of resetting or overwriting it. The homepage is bind-mounted as a single file, so restart the portal service after pulling to refresh that mount. Open `http://192.168.1.155:8080` and verify both cards after the pull.

The existing Mac-to-NAS sync script also transfers the root `index.html` alongside the full `games/` directory and Caddy configuration. Its existing game-import behavior is retained, and no deletion flag has been added.

Docker references: [restart a selected Compose service](https://docs.docker.com/reference/cli/docker/compose/restart/) and [single-file bind-mount replacement behavior](https://github.com/moby/moby/issues/6011).
