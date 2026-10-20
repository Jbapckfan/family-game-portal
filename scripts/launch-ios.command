#!/bin/bash
# Open the private Alford Daily source in Xcode without replacing local work.
# Usage: bash launch-ios.command [checkout-directory]
set -euo pipefail

fail() { printf 'Stopped: %s\n' "$*" >&2; exit 1; }
if [ "$#" -gt 1 ]; then
  fail 'Usage: bash launch-ios.command [checkout-directory]'
fi
[ "$(uname -s)" = 'Darwin' ] || fail 'This launcher requires macOS with Xcode.'
for tool in git xcode-select xcodebuild python3 open; do
  command -v "$tool" >/dev/null 2>&1 || fail "Required tool is missing: $tool. No software was installed."
done
xcode-select -p >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1 ||
  fail 'Full Xcode is not ready. Open Xcode, complete its setup, and select it in Xcode Settings > Locations > Command Line Tools.'

repo_url='https://github.com/Jbapckfan/family-game-portal.git'
target="${1:-$HOME/Projects/AlfordDaily}"
case "$target" in /*) ;; *) target="$PWD/$target" ;; esac
[ ! -L "$target" ] || fail 'The checkout destination is a symlink. Choose a real directory.'

if [ -e "$target" ]; then
  [ -d "$target" ] || fail 'The destination is a file; it was not changed.'
  target="$(cd "$target" && pwd -P)"
  root="$(git -C "$target" rev-parse --show-toplevel 2>/dev/null)" ||
    fail 'The destination is not a Git repository; it was not changed.'
  root="$(cd "$root" && pwd -P)"
  [ "$root" = "$target" ] || fail 'Choose the repository root, not a nested folder.'
  origin="$(git -C "$target" config --get remote.origin.url || true)"
  case "$origin" in
    'https://github.com/Jbapckfan/family-game-portal.git'|'https://github.com/Jbapckfan/family-game-portal'|'git@github.com:Jbapckfan/family-game-portal.git'|'ssh://git@github.com/Jbapckfan/family-game-portal.git') ;;
    *) fail 'The origin is not the expected private family-game-portal repository.' ;;
  esac
  [ -z "$(git -C "$target" status --porcelain)" ] ||
    fail 'This checkout has local changes or untracked files. Preserve them before updating; nothing was reset or stashed.'
  branch="$(git -C "$target" symbolic-ref --quiet --short HEAD || true)"
  [ "$branch" = 'main' ] || fail 'This checkout is not on main. Its branch was left unchanged.'
  git -C "$target" fetch origin main ||
    fail 'Could not fetch the private GitHub repository. Check your GitHub authentication and network.'
  git -C "$target" merge-base --is-ancestor HEAD origin/main ||
    fail 'This checkout has local commits not on origin/main. Resolve them yourself; no history was rewritten.'
  git -C "$target" merge --ff-only origin/main || fail 'Fast-forward update failed; no reset was attempted.'
else
  mkdir -p "$(dirname "$target")"
  git clone --branch main --single-branch -- "$repo_url" "$target" ||
    fail 'Could not clone the private GitHub repository. Authenticate with your existing GitHub credentials, then retry with an unused destination.'
  target="$(cd "$target" && pwd -P)"
fi

project="$target/ios/AlfordDaily.xcodeproj"
[ -f "$project/project.pbxproj" ] || fail 'The Xcode project is missing from this checkout.'
printf '\nChecking the native project...\n'
(cd "$target" && python3 ios/scripts/validate_project.py) || fail 'Native project validation failed.'
if command -v node >/dev/null 2>&1; then
  (cd "$target" && node scripts/sync-ios-web.mjs --check) || fail 'Bundled game validation failed.'
else
  printf 'Node.js is unavailable; the optional web-bundle parity check was not run.\n'
fi
printf '\nSource commit: '
git -C "$target" rev-parse --short HEAD
open -a Xcode "$project" || fail 'Xcode could not open the project.'
printf '\nOpened Alford Daily in Xcode.\nChoose scheme AlfordDaily, select an iPhone Simulator, and press Run.\nFor a physical iPhone, select your Apple development team first.\nThe app is not signed, installed, or uploaded by this launcher. No purchases or ads were enabled.\n'
