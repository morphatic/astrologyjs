#!/usr/bin/env bash
# Validate commit message against Conventional Commits format.
# Invoked by lefthook commit-msg with the commit-message file path as $1.
set -eu

msg_file="${1:-}"
if [[ -z "$msg_file" ]] || [[ ! -f "$msg_file" ]]; then
  exit 0
fi

msg=$(head -n 1 "$msg_file" 2>/dev/null || echo "")

# Allow merge/revert/fixup/squash commits produced by git itself.
case "$msg" in
  "Merge "*|"Revert "*|"fixup!"*|"squash!"*) exit 0 ;;
esac

pattern='^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([^)]+\))?!?: .+'

if ! echo "$msg" | grep -qE "$pattern"; then
  echo "Commit message does not follow Conventional Commits format." >&2
  echo "" >&2
  echo "  Got:      $msg" >&2
  echo "" >&2
  echo "  Expected: <type>[(<scope>)][!]: <description>" >&2
  echo "  Examples: feat(auth): add token refresh" >&2
  echo "            fix: correct off-by-one in pagination" >&2
  echo "            chore(deps): bump axum to 0.7" >&2
  echo "            refactor!: rename Client to ApiClient (breaking)" >&2
  echo "" >&2
  echo "  Types: feat, fix, chore, docs, refactor, test, perf," >&2
  echo "         build, ci, style, revert" >&2
  exit 1
fi

exit 0
