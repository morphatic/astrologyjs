# plinth/

The foundation of this project. Holds agent-facing context — specs and planning — that informs
implementation work without belonging in the runtime codebase.

Named after the architectural plinth (the base a column stands on).

## Layout

- `specs/` — NLSpec files in the tiered format (index + contract + rationale).
  - `astrologyjs.nlspec.index.md` — orientation. Read first.
  - `astrologyjs.nlspec.md` — the binding contract for 2.0.0.
  - `astrologyjs.nlspec.rationale.md` — why the contract says what it says, plus the body, aspect,
    glyph, and credit-cost reference tables.
  - `astrologyjs.nlspec.audit.md` — completeness audit against the contract.

  Drafted 2026-08-10 via `/spec-interview` (Standard tier).
- `planning/` — roadmaps, todos, state, bootstrap checklists.
- `private/` — **untracked and gitignored.** Planning, positioning, and strategy notes that do not
  belong in a public repository. Present in the maintainer's working tree only; a clone will not
  have this directory, and nothing in the tracked tree may link to its contents.

## Conventions

- Specs are the binding source of truth for implementation. When a spec and the code disagree, the
  spec is right until the spec is deliberately updated.
- Research artifacts are dated and attributed. They capture a point-in-time understanding; they are
  not automatically kept current.
- Planning documents are mutable and should be kept up to date as the project progresses.
- **This repository is public.** Anything commercial, legal, or strategic — pricing, positioning,
  competitor analysis, licensing posture, upstream provenance — goes in `private/`. The test before
  committing any document here is whether it would be fine to read on the public web, because it
  will be. Note that a public `cspell.json` word list is part of the tracked tree too: adding a
  sensitive proper noun there leaks it even when no document mentions it.
