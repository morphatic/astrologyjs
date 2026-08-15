#!/usr/bin/env bash
# Refuse pushes originating from a protected branch. Invoked by lefthook pre-push.
#
# Rationale: the pre-commit hook prevents you from committing to main/master/develop
# locally, so if your current branch IS one of those, any push is either (a)
# someone bypassed pre-commit, or (b) history includes an unguarded commit. Either
# way, block. Feature-branch-to-protected-remote pushes are caught server-side by
# GitHub branch protection after `setup-github.sh` runs.
set -u

branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")

case "$branch" in
  main|master|develop)
    echo "Refusing push: current branch is protected ($branch)." >&2
    echo "" >&2
    echo "You shouldn't have local commits on $branch. If you do, the usual fix:" >&2
    echo "  git checkout -b fix/recover-branch  # move work onto a feature branch" >&2
    echo "  git checkout $branch" >&2
    echo "  git reset --hard origin/$branch     # resync with remote" >&2
    echo "" >&2
    echo "Then push the feature branch and open a PR:" >&2
    echo "  gh pr create --base $branch --fill" >&2
    exit 1
    ;;
esac

exit 0
