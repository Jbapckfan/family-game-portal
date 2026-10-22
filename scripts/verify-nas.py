#!/usr/bin/env python3
"""Verify that a running portal serves the exact tested game release."""
import argparse
import concurrent.futures
import hashlib
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIME_TYPES = {
    ".html": {"text/html"},
    ".mjs": {"text/javascript", "application/javascript"},
    ".js": {"text/javascript", "application/javascript"},
    ".css": {"text/css"},
    ".json": {"application/json"},
    ".svg": {"image/svg+xml"},
}


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        # A different host can return matching bytes while browser module CORS fails.
        # Verify the final public HTTPS origin explicitly instead of following it here.
        return None


def check_asset(base_url, relative, expected):
    url = base_url.rstrip("/") + "/" + urllib.parse.quote(relative, safe="/")
    request = urllib.request.Request(url, headers={
        "Cache-Control": "no-cache", "Accept-Encoding": "identity",
        "User-Agent": "AlfordDaily-ReleaseCheck/1",
    })
    try:
        with urllib.request.build_opener(NoRedirects()).open(request, timeout=12) as response:
            if response.status != 200:
                return f"{relative}: HTTP {response.status}"
            suffix = ".html" if not relative or relative.endswith("/") else Path(relative).suffix
            allowed = MIME_TYPES.get(suffix)
            content_type = response.headers.get_content_type()
            if allowed and content_type not in allowed:
                return f"{relative}: incorrect Content-Type {content_type}"
            body = response.read(len(expected) + 1)
            if hashlib.sha256(body).digest() != hashlib.sha256(expected).digest():
                return f"{relative}: served content differs from this release"
    except (OSError, urllib.error.URLError) as error:
        return f"{relative}: {error}"
    return None


def expected_assets(root=ROOT):
    assets = {"index.html": (root / "index.html").read_bytes()}
    bundle = root / "ios/Web/games"
    for file in sorted(bundle.rglob("*")):
        if file.is_file():
            relative = "games/" + file.relative_to(bundle).as_posix()
            canonical = (root / relative).read_bytes()
            if canonical != file.read_bytes():
                raise ValueError(f"Offline bundle is stale: {relative}")
            assets[relative] = canonical
    for file in sorted((root / "games/daily").rglob("*")):
        if file.is_file() and file.suffix in {
            ".html", ".mjs", ".js", ".css", ".svg", ".json", ".webmanifest",
            ".ttf", ".otf", ".woff", ".woff2",
        } and not file.name.endswith((".test.mjs", ".spec.mjs")):
            assets[file.relative_to(root).as_posix()] = file.read_bytes()
    return assets


def expected_static_assets(directory):
    """Check canonical directory URLs, including hosts that redirect /index.html."""
    assets = {}
    for file in sorted(directory.rglob("*")):
        if file.is_symlink():
            raise ValueError(f"Symbolic links are not public runtime assets: {file}")
        if not file.is_file() or file.name in {"404.html", "_headers", "_redirects"}:
            continue
        relative = file.relative_to(directory).as_posix()
        if file.name == "index.html":
            relative = relative[:-len("index.html")]
        assets[relative] = file.read_bytes()
    if "" not in assets:
        raise ValueError("The static build is missing its collection index.html")
    return assets


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Portal origin or static collection base URL")
    parser.add_argument("--static-directory", type=Path, help="Verify a standalone build produced by stage-site.mjs")
    args = parser.parse_args()
    parsed = urllib.parse.urlsplit(args.url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.query or parsed.fragment:
        parser.error("Use an HTTP(S) portal URL without a query or fragment")
    inventory_path = args.static_directory / "release.json" if args.static_directory else ROOT / "docs/puzzle-inventory.json"
    inventory = json.loads(inventory_path.read_text())
    games = inventory["games"]
    if len(games) != 32 or len({g["slug"] for g in games}) != 32 or min(g["puzzles"] for g in games) < 120:
        raise ValueError("This release must contain 32 games with at least 120 puzzles each")
    if args.static_directory:
        assets = expected_static_assets(args.static_directory)
        for game in games:
            if f"games/{game['slug']}/" not in assets:
                raise ValueError(f"Missing game launch route: {game['slug']}")
    else:
        assets = expected_assets()
        # Verify the directory URLs people open as well as explicit files.
        assets[""] = assets["index.html"]
        assets["games/daily/"] = assets["games/daily/index.html"]
        for game in games:
            path = f"games/{game['slug']}/"
            assets[path] = assets[path + "index.html"]
    # Fail promptly if the service is unavailable, before scheduling every asset.
    entry = "" if args.static_directory else "games/daily/"
    error = check_asset(args.url, entry, assets[entry])
    if error:
        raise ValueError(error)
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pending = [pool.submit(check_asset, args.url, path, body) for path, body in assets.items()]
        for future in concurrent.futures.as_completed(pending):
            error = future.result()
            if error:
                failures.append(error)
    if failures:
        raise ValueError("Release verification failed:\n" + "\n".join(sorted(failures)))
    total = sum(g["puzzles"] for g in games)
    print(f"Verified 32 games, {total:,} prepared puzzles, and {len(assets)} exact assets and launch routes.")
    print(f"Collection: {args.url.rstrip('/')}/{entry}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
