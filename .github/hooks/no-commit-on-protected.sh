#!/usr/bin/env bash
# Refuse commits on protected branches. Invoked by lefthook pre-commit.
set -eu

branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")

case "$branch" in
  main|master|develop)
    echo "Refusing commit on protected branch: $branch" >&2
    echo "" >&2
    echo "Create a working branch first:" >&2
    echo "  git checkout -b feat/<short-description>" >&2
    echo "  git checkout -b fix/<short-description>" >&2
    echo "" >&2
    echo "Valid branch-name prefixes: feat, fix, chore, docs, refactor, test, perf." >&2
    exit 1
    ;;
esac

exit 0
