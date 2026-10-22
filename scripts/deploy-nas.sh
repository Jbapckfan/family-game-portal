#!/usr/bin/env bash
# Run on the NAS from a clean checkout. No reset, stash, deletion, or force-push.
set -euo pipefail

if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  portal_repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
else
  # Allows an updated Mac checkout to stream this script to the older NAS checkout.
  portal_repo=$PWD
fi
cd "$portal_repo"
if [[ $# -gt 1 ]]; then
  echo "Usage: bash scripts/deploy-nas.sh [verified-commit-sha]" >&2
  exit 2
fi
for executable in git docker python3; do
  command -v "$executable" >/dev/null || { echo "Required command missing: $executable" >&2; exit 1; }
done
case "$(git remote get-url origin)" in
  https://github.com/Jbapckfan/family-game-portal|https://github.com/Jbapckfan/family-game-portal.git|git@github.com:Jbapckfan/family-game-portal.git) ;;
  *) echo "Refusing to deploy an unexpected repository origin." >&2; exit 1 ;;
esac
if [[ -n "$(git status --porcelain)" ]]; then
  echo "The NAS checkout has local work. Preserve and review it before deploying:" >&2
  git status --short >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != main ]]; then
  echo "Deploy from the main branch; the current checkout was left unchanged." >&2
  exit 1
fi
docker compose version >/dev/null
docker info --format '{{.ServerVersion}}' >/dev/null
docker compose config --services | grep -Fxq game-portal || { echo "Compose service game-portal is missing." >&2; exit 1; }

git fetch --no-tags origin main
portal_target=${1:-$(git rev-parse origin/main)}
if [[ ! "$portal_target" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full, verified commit SHA is required." >&2
  exit 2
fi
git cat-file -e "$portal_target^{commit}"
git merge-base --is-ancestor "$portal_target" origin/main || { echo "Target is not on origin/main." >&2; exit 1; }
git cat-file -e "$portal_target:scripts/verify-nas.py"
git show "$portal_target:docs/puzzle-inventory.json" | python3 -c 'import json,sys; v=json.load(sys.stdin); g=v["games"]; assert len(g)==32 and len({x["slug"] for x in g})==32 and min(x["puzzles"] for x in g)>=120, "Invalid puzzle inventory"'
portal_previous=$(git rev-parse HEAD)
git merge-base --is-ancestor "$portal_previous" "$portal_target" || {
  echo "The NAS and requested release have diverged. No files or containers were changed." >&2
  exit 1
}
echo "Updating portal from $portal_previous to $portal_target"
git merge --ff-only "$portal_target"
# Recreate only this service so single-file bind mounts reopen the updated files.
docker compose up -d --no-deps --force-recreate game-portal

portal_verified=false
for portal_attempt in 1 2 3; do
  if python3 scripts/verify-nas.py http://127.0.0.1:8080; then
    portal_verified=true
    break
  fi
  if [[ "$portal_attempt" -lt 3 ]]; then sleep 2; fi
done
if [[ "$portal_verified" != true ]]; then
  echo "The service was updated but its HTTP verification failed. Do not share this release yet." >&2
  echo "Previous revision: $portal_previous. Inspect: docker compose logs --tail=80 game-portal" >&2
  exit 1
fi
echo "Deployed revision: $(git rev-parse HEAD)"
echo "Home-network testers: http://192.168.1.155:8080/games/daily/"
echo "For remote testers, verify the existing public HTTPS route separately with scripts/verify-nas.py."
