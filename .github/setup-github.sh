#!/usr/bin/env bash
#
# setup-github.sh — configure GitHub repo settings and branch protection.
#
# Run this ONCE, after `gh repo create` (or the first push that creates the remote).
#
# What it does:
#   - Sets merge strategy: squash-only, auto-delete head branches
#   - Creates the standard label set (priority:*, NOT4AI)
#   - For two-tier repos: sets default branch to develop, protects main + develop
#   - For trunk-only repos (--trunk-only): protects main only
#   - Branch protection requires:
#       - PR merge (no direct pushes)
#       - Status check "CI (required check)" passing
#       - Linear history (no merge commits)
#       - Up-to-date branch before merge
#       - No force pushes, no deletions
#       - Admins included (prevents `--admin` bypass)
#
# Prereqs:
#   - gh CLI authenticated (`gh auth status`)
#   - Remote exists on GitHub
#   - If two-tier: a `develop` branch has been pushed at least once
#   - If the repo is PRIVATE: the account/org must be on GitHub Pro/Team or
#     higher. Branch protection is unavailable on Free-plan private repos.
#     Public repos get protection on any plan.
#
# Usage:
#   bash .github/setup-github.sh                # two-tier (default)
#   bash .github/setup-github.sh --trunk-only   # main only
#
# Platform notes:
#   - On Git Bash / MSYS2 on Windows, leading slashes in `gh api` path
#     arguments are auto-rewritten to Windows paths (e.g. /repos/... becomes
#     C:/Program Files/Git/repos/...). This script sets MSYS_NO_PATHCONV=1
#     to suppress that, and also writes its `gh api` paths without a leading
#     slash so the script works regardless of the env var.

set -euo pipefail

# Disable MSYS path conversion so `gh api` arguments aren't rewritten on
# Git Bash for Windows. Harmless on macOS/Linux.
export MSYS_NO_PATHCONV=1

TRUNK_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --trunk-only) TRUNK_ONLY=1 ;;
    -h|--help)
      sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "setup-github.sh: unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ then retry." >&2
  exit 1
fi

OWNER_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Configuring $OWNER_REPO ..."
echo ""

echo "→ Setting merge strategy: squash-only, auto-delete head branches ..."
gh repo edit "$OWNER_REPO" \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --delete-branch-on-merge

echo "→ Creating standard labels ..."
# Priority labels for triage; NOT4AI marks issues that are off-limits to
# AI agents (human-only judgment, creative direction, operator actions).
# --force makes re-runs idempotent (updates color/description if present).
create_label() {
  gh label create "$1" --color "$2" --description "$3" --force >/dev/null \
    && echo "  ✓ $1" \
    || echo "  ⚠ could not create label: $1" >&2
}
create_label "priority:critical" "b60205" "Drop everything"
create_label "priority:high"     "d93f0b" "Next up"
create_label "priority:medium"   "fbca04" "Soon"
create_label "priority:low"      "c2e0c6" "Eventually"
create_label "NOT4AI"            "5319e7" "Human-only: do not assign to or pick up with an AI agent"

# branch_exists: returns 0 if the named branch exists on the remote.
branch_exists() {
  local branch="$1"
  gh api "repos/$OWNER_REPO/branches/$branch" >/dev/null 2>&1
}

# protect_branch: applies the standard protection ruleset to a branch.
# On Free-plan private repos the GitHub API returns 403 with a clear
# "Upgrade to GitHub Pro" message; the script surfaces that and keeps going
# so merge-strategy config is still applied.
protect_branch() {
  local branch="$1"
  if ! branch_exists "$branch"; then
    echo "  ⚠ Branch '$branch' does not exist on remote yet. Push it first, then re-run this script."
    return 0
  fi
  echo "→ Protecting $branch ..."
  local stderr_file
  stderr_file=$(mktemp)
  if gh api --method PUT "repos/$OWNER_REPO/branches/$branch/protection" --input - >/dev/null 2>"$stderr_file" <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI (required check)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true
  },
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "restrictions": null
}
EOF
  then
    rm -f "$stderr_file"
    echo "  ✓ $branch protected."
  else
    local err
    err=$(cat "$stderr_file")
    rm -f "$stderr_file"
    if echo "$err" | grep -qi "upgrade to github pro"; then
      echo "  ✗ $branch NOT protected: account/org is on GitHub Free and the repo is private." >&2
      echo "    Branch protection on private repos requires GitHub Pro or Team." >&2
      echo "    Options: (1) make the repo public, (2) upgrade the account/org plan," >&2
      echo "             (3) move the repo to a namespace that is already on Pro/Team." >&2
    else
      echo "  ✗ $branch protection failed:" >&2
      echo "$err" | sed 's/^/    /' >&2
    fi
  fi
}

if [[ $TRUNK_ONLY -eq 1 ]]; then
  protect_branch main
else
  if branch_exists develop; then
    echo "→ Setting default branch to develop ..."
    gh repo edit "$OWNER_REPO" --default-branch develop
  else
    echo "  ⚠ 'develop' branch not yet on remote. Push it, then re-run to set it as default."
  fi
  protect_branch main
  protect_branch develop
fi

echo ""
echo "Done."
echo ""
echo "Notes:"
echo "  - 'CI (required check)' is the aggregate gate in .github/workflows/ci.yml."
echo "    If you rename that job, update branch protection to match."
echo "  - enforce_admins=true means YOU can't bypass these rules either."
echo "    To disable temporarily: gh api -X DELETE repos/$OWNER_REPO/branches/<branch>/protection/enforce_admins"
