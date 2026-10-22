#!/usr/bin/env python3
"""Package the complete Alford Daily source and a standalone playable web build."""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OMIT_DIRS = {"node_modules", "dist", "__pycache__", ".git", ".openai", ".cache", "DerivedData", "build"}
DOCS = ["CODEX-TERMINAL-PROMPT.md", "OPUS-5.5-REVIEW-PROMPT.md", "COMMERCIAL-LAUNCH-PLAN.md", "BRAND-AND-MONETIZATION-STRATEGY.md",
        "NAS-AND-DOMAIN-DEPLOYMENT.md", "TESTER-GUIDE.md", "RELEASE-STATE.md"]


def source_files(inventory):
    """Explicit product scope: no unrelated family-portal game directories."""
    folders = [ROOT / "games" / game["slug"] for game in inventory["games"]]
    folders += [ROOT / "games" / name for name in ("daily", "kimi-runtime", "deepseek-runtime")]
    folders += [ROOT / name for name in ("docs", "scripts", "tests", "ios", "design", "sources", "packages/kimi-pebbles", ".github/workflows")]
    paths = set()
    for folder in folders:
        if not folder.is_dir() or folder.is_symlink():
            raise ValueError(f"Required source directory is missing or linked: {folder}")
        for directory, directories, files in os.walk(folder, followlinks=False):
            base = Path(directory)
            directories[:] = sorted(name for name in directories
                                    if name not in OMIT_DIRS and not name.startswith(".")
                                    and base / name != ROOT / "docs/ui-refinement")
            for name in directories:
                if (base / name).is_symlink():
                    raise ValueError(f"Linked source directory: {base / name}")
            for name in sorted(files):
                path = base / name
                if name.startswith(".") or name.endswith((".pyc", ".tsbuildinfo")):
                    continue
                if path == ROOT / "docs/ui-refinement-2026-10-21.md":
                    continue  # Unpublished intermediate screenshots are not release evidence.
                if path.is_symlink() or not path.is_file():
                    raise ValueError(f"Not a regular source file: {path}")
                paths.add(path)
    for name in ("README.md", "ALFORD-DAILY-START-HERE.md", "SETUP.md", "Caddyfile", "docker-compose.yml",
                 "index.html", "games/index.html", "sync-to-nas.sh", "add-game.sh"):
        path = ROOT / name
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Required integration file is missing or linked: {path}")
        paths.add(path)
    for path in sorted((ROOT / "deploy").iterdir()):
        if not path.is_file() or path.is_symlink() or path.name.startswith("."):
            raise ValueError(f"Unexpected deployment entry: {path}")
        paths.add(path)
    return sorted(paths)


def verify_published_source(files, commit, verified_tree):
    """Compare every included source blob with the selected commit's Git tree."""
    if verified_tree:
        document = json.loads(verified_tree.read_text())
        if document.get("commit") != commit or document.get("truncated"):
            raise ValueError("Verified tree export must name the selected commit and be complete")
        entries = {entry["path"]: entry["sha"] for entry in document["tree"] if entry["type"] == "blob"}
    else:
        result = subprocess.run(["git", "ls-tree", "-rz", commit], cwd=ROOT, check=True, capture_output=True)
        entries = {}
        for record in result.stdout.split(b"\0"):
            if not record:
                continue
            metadata, path = record.split(b"\t", 1)
            _mode, kind, sha = metadata.decode().split()
            if kind == "blob":
                entries[path.decode()] = sha
    failures = []
    for path in files:
        content = path.read_bytes()
        actual = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
        relative = path.relative_to(ROOT).as_posix()
        if entries.get(relative) != actual:
            failures.append(relative)
    if failures:
        raise ValueError("Source differs from the selected published commit: " + ", ".join(failures))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="New absolute package directory, outside the repository")
    parser.add_argument("--commit", required=True, help="Full published GitHub release commit SHA")
    parser.add_argument("--verified-tree", type=Path,
                        help="For a partial checkout: trusted complete GitHub API tree export with commit, tree and truncated fields")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        parser.error("--commit must be the full published 40-character SHA")
    if not args.output.is_absolute():
        parser.error("--output must be absolute")
    for ancestor in [args.output, *args.output.parents]:
        if ancestor.is_symlink():
            parser.error("Output path cannot contain a symbolic link")
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents or output in ROOT.parents:
        parser.error("Output must be outside the source repository")
    archive = output.with_suffix(".zip")
    checksum_path = archive.with_suffix(".zip.sha256")
    if any(path.exists() or path.is_symlink() for path in (output, archive, checksum_path)):
        parser.error("Output directory, ZIP and checksum must all be new; existing files are never overwritten")
    inventory = json.loads((ROOT / "docs/puzzle-inventory.json").read_text())
    runway = json.loads((ROOT / "docs/daily-runway.json").read_text())
    assert inventory["gameCount"] == 32 and inventory["minimumPerGame"] >= 120
    assert runway["gameCount"] == 32 and runway["days"] >= 30 and runway["allSelectorsExecuted"]
    for name in DOCS:
        assert (ROOT / "docs" / name).is_file(), name
    files = source_files(inventory)
    verify_published_source(files, args.commit, args.verified_tree)
    output.mkdir(parents=True)
    subprocess.run(["node", str(ROOT / "scripts/stage-site.mjs"), str(output / "web")], cwd=ROOT, check=True)
    for path in files:
        destination = output / "source" / path.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)
    for name in DOCS:
        shutil.copy2(ROOT / "docs" / name, output / name)
    (output / "RELEASE-COMMIT.txt").write_text(
        f"{args.commit}\nhttps://github.com/Jbapckfan/family-game-portal/commit/{args.commit}\n"
        "This identifies the source release. NAS and public-host deployment require their own verification.\n")
    launcher = output / "Open-Alford-Daily.command"
    launcher.write_text('''#!/bin/bash
set -e
pack_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\\n' 'Python 3 is required. Ask Codex to install Python 3, then run this launcher again.'
  exit 1
fi
exec python3 "$pack_dir/source/scripts/open-preview.py" "$pack_dir/web"
''')
    launcher.chmod(0o755)
    (output / "START-HERE.md").write_text(f'''# Alford Daily — full launch package

32 games · 8,001 prepared puzzles · at least 120 per game.

## Play it now

Extract this entire ZIP. On a Mac with Python 3, open `Open-Alford-Daily.command`.
If needed, run `bash Open-Alford-Daily.command` from Terminal in this folder.
On any supported desktop with Python 3: `python3 source/scripts/open-preview.py web`.
The launcher opens `http://127.0.0.1:8765/`. Keep Terminal open while playing.
Reuse that address and browser to retain local progress. Opening index.html directly is not supported.
This local address is not an Internet sharing link.

## Continue in Codex

Open Codex in your Mac terminal and give it the complete `CODEX-TERMINAL-PROMPT.md`.
Keep this folder available to it. The prompt includes the NAS destination, source repo,
verification commands, domain options, and the pending independent Opus 5.5 review.
Read `RELEASE-STATE.md` for what was actually verified and what remains blocked.

## Contents

- `web/`: the ready-to-host standalone collection; publish only this folder.
- `source/`: complete Alford Daily game sources, puzzle banks/generators, Kimi React source and lockfile,
  iOS project/offline assets, tests, source provenance, font notices, and deployment scripts.
- `COMMERCIAL-LAUNCH-PLAN.md`: the 30-day beta, product positioning, content operations and pricing hypotheses.
- `BRAND-AND-MONETIZATION-STRATEGY.md`: recommended name, screened alternatives, studio architecture and a concrete first paid offer.
- `NAS-AND-DOMAIN-DEPLOYMENT.md`: NAS, studio subdomain and managed static hosting instructions.
- `TESTER-GUIDE.md`: opening instructions and a short feedback template.
- `OPUS-5.5-REVIEW-PROMPT.md`: the independent review still to be run in an authenticated model session.
- `source/docs/astra-review-*.md`: actual GPT-6 Astra gameplay evidence, assistance and limits.
- `source/docs/daily-runway.json`: 960 daily selections across 32 games for October 23–November 21, 2026.
- `MANIFEST.json`: SHA-256 of each packaged file except the manifest itself.
- `RELEASE-COMMIT.txt`: exact GitHub source revision, `{args.commit}`.

## Source scope and deployment status

This is the complete **Alford Daily** product package. It is not a mirror of the larger family-game-portal
repository and intentionally omits unrelated legacy games. Integration files are included for reference.
Clone or update the authoritative GitHub repository for an existing NAS-portal deployment; never replace
that checkout with this subset or use rsync --delete against it. The standalone web build is independent.

The connected Mac was offline during preparation. No live NAS update or new public game hostname has been
verified. `play.cursedtoasterstudios.com` is a proposed destination; it must be configured and tested.
Opus 5.5 has not run in this session. Commercial payments, accounts, analytics and cross-device saves are
not active. The beta plan and price points are recommendations, not measured demand or revenue forecasts.
''')
    records = []
    for path in sorted(output.rglob("*")):
        if not path.is_file():
            continue
        content = path.read_bytes()
        records.append({"path": path.relative_to(output).as_posix(), "bytes": len(content),
                        "sha256": hashlib.sha256(content).hexdigest()})
    manifest = {"releaseCommit": args.commit, "gameCount": 32, "preparedRecords": inventory["totalPuzzles"],
                "minimumPerGame": inventory["minimumPerGame"], "dailyAuditStart": runway["start"],
                "dailyAuditEnd": runway["end"], "fileCountExcludingManifest": len(records), "files": records}
    (output / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")
    with zipfile.ZipFile(archive, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for path in sorted(output.rglob("*")):
            if path.is_file():
                zipped.write(path, Path(output.name) / path.relative_to(output))
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.testzip() is None
        assert (zipped.getinfo(output.name + "/Open-Alford-Daily.command").external_attr >> 16) & 0o111
        for record in records:
            data = zipped.read(output.name + "/" + record["path"])
            assert hashlib.sha256(data).hexdigest() == record["sha256"], record["path"]
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    with checksum_path.open("x") as checksum_file:
        checksum_file.write(f"{checksum}  {archive.name}\n")
    print(json.dumps({"zip": str(archive), "bytes": archive.stat().st_size,
                      "files": len(records) + 1, "sha256": checksum}, indent=2))


if __name__ == "__main__":
    main()
