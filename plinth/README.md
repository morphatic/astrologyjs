# plinth/

The foundation of this project. Holds agent-facing context — specs, research, planning — that
informs implementation work without belonging in the runtime codebase.

Named after the architectural plinth (the base a column stands on).

## Layout

- `specs/` — NLSpec files in the tiered format (index + contract + rationale).
  - `astrologyjs.nlspec.index.md` — orientation. Read first.
  - `astrologyjs.nlspec.md` — the binding contract.
  - `astrologyjs.nlspec.rationale.md` — why the contract says what it says.

  These are currently empty templates; drafting them is the next step.
- `research/` — domain investigations, prior art reviews, comparative analyses.
  - `community-and-positioning.md` — where the astrological-programming community lives, what it
    complains about, and how Morphemeris sits against alternatives. Point-in-time, 2026-08-09.
- `planning/` — roadmaps, todos, state, bootstrap checklists.
  - `revival-plan.md` — the plan for bringing `astrologyjs` back to life on top of the Morphemeris
    API. **Read this first**; it is the binding plan until the NLSpec supersedes it.
  - `bootstrap-language.md` — checklist to run when the stack is confirmed.

## Conventions

- Specs are the binding source of truth for implementation. When a spec and the code disagree, the
  spec is right until the spec is deliberately updated.
- Research artifacts are dated and attributed. They capture a point-in-time understanding; they are
  not automatically kept current.
- Planning documents are mutable and should be kept up to date as the project progresses.
