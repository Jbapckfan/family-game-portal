# Shortlist implementation plan

**Goal:** Deliver a quick three-scan word deduction game, its private Site and portal integration.

**Architecture:** The engine evaluates scans and solves bounded candidate sets. A shared shell owns the daily lifecycle; the app owns letter selection, pencil marks and a confirmed final pick.

**Tech stack:** Buildless HTML, CSS, browser ES modules, Node's built-in test runner.

**Spec:** `../specs/2026-10-20-shortlist-design.md`

## Global constraints

- Twelve candidate words; three two-distinct-letter scans; one final confirmed pick.
- Scan results count letter presence once per distinct letter and never disclose positions.
- Prove a three-scan strategy for every candidate on every board.
- Midnight America/Chicago, epoch 2026-10-20; browser-local separate daily/practice saves.
- Preserve private access and existing portal files.

## Tasks

- [ ] Implement and test pure scan, pick, elimination, evidence-only hints, reveal, restoration, statistics and share API in `engine.mjs`.
- [ ] Generate a deterministic finite collection from curated words, with a solver that verifies every secret can be distinguished in three adaptive scans. Save data and meaningful tests.
- [ ] Build the scan keyboard, history and twelve-word list in `index.html`, `styles.css` and `app.mjs`; share lifecycle code in `shell.mjs`.
- [ ] Test repeated/reversed scans, repeated letters, invalid picks, terminal immutability, corrupt saves, storage fallback and stale tabs.
- [ ] Browser-check keyboard and tap input, manual elimination, winning and losing final picks, hints, sharing, practice and responsive layout.
- [ ] Integrate portable assets/tests/docs into the portal, push a non-force private repository commit, package exact source and publish the private Site.

## Review focus

The three-scan guarantee must cover all candidates rather than only the chosen secret. Hints must derive from public evidence. Manual marks must not corrupt solver state. A canceled final-pick dialog must spend nothing. Daily storage and terminal records must stay consistent across tabs and dates. Source integration is distinct from live NAS deployment.
