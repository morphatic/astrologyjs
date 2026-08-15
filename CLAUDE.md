# astrologyjs

An astrological charting library for JavaScript/TypeScript, backed by the Morphemeris ephemeris API.

## Project state — read this first

This is a **revival**, not a greenfield project. `astrologyjs@1.3.1` is published on npm with 154
GitHub stars and 45 forks, and it is broken: its ephemeris backend
(`http://www.morphemeris.com/ephemeris.php`) died years ago, and four open issues going back to 2017
all report the same failure. People are still starring it and still hitting the wall.

Two consequences that shape every decision:

- **There are real users on the other side of this.** Error messages, README copy, and issue replies
  matter as much as the code. The register is plain and unspun: this was a part-time
  project that outran its author's bandwidth, the backend went away, and there is a real service
  behind it now. Do not oversell, and do not apologize at length.
- **The domain model is worth keeping.** `Chart`, `Planet`, `Aspect`, `Person`, `ChartFactory`, and
  the aspect math in `src/` are fine — pure computation that does not care where the numbers came
  from. What must change is the data layer and the build.

Start with `plinth/specs/astrologyjs.nlspec.index.md`, then load the contract. It is the binding
spec and it supersedes any earlier planning document.

### Decisions already made

- **ESM-only.** `2.x` ships no CJS build. Node 20.19+/22.12+ support `require(esm)`, Node 18 is EOL,
  and dropping CJS avoids the dual-package hazard on a class-based domain model.
- **Callers supply their own Morphemeris API key.** No shipped shared key, no free proxy — both
  recreate the failure being fixed. See spec §4 and §11.
- **Local computation stays local.** Morphemeris provides ephemeris and houses; aspects, synastry,
  and composites are derived in-library. Server-side equivalents are optional extras, not the
  default path. See spec §1.2 and §1.4.
- **Trunk-based branching**, `main` only. (`master` was renamed to `main` on 2026-08-09.)
- **Toolchain:** tsup + vitest + TypeScript, matching `@morphemeris/mcp`. The 2016 gulp/rollup/
  jasmine/istanbul/Babel/Travis stack has been removed; recover from git history if ever needed.

## Working in this project

- **`plinth/`** holds all agent-facing context: specs, research, and planning. Load from here when
  you need background.
- **Specs use the tiered NLSpec format** (index + contract + rationale). Start with
  `plinth/specs/astrologyjs.nlspec.index.md` to orient, then load the contract (`.nlspec.md`) for
  implementation work. Pull the rationale (`.nlspec.rationale.md`) only when you hit a judgment call.
- **Slash commands:** `/spec-quick` to draft an NLSpec from a freeform description, `/spec-interview`
  for the structured interview flow, `/spec-audit` for completeness audits.

### Local context not in this repository

- `plinth/private/` — untracked and gitignored. Holds planning, positioning, and strategy notes that
  do not belong in a public repository. Present in Morgan's working tree only; absent from a clone.
  Anything commercially or legally sensitive goes here, not in `plinth/specs/`.
- `~/dev/morphemeris/` — the API this library consumes. Its NLSpec is the authority on endpoint
  shapes, auth, error codes, and rate limits, and wins wherever this repo restates it. `mcp/` there
  is the toolchain precedent.

## Git workflow

Branching model: trunk-based (`main` only). Feature branches merge directly into `main`.

Rules (enforced by lefthook + CI, not just convention):

- **Never commit directly to `main`.** The pre-commit hook blocks this. Create a working branch:
  `git checkout -b feat/<slug>` or `fix/<slug>`, `chore/`, `docs/`, `refactor/`, `test/`, `perf/`.
- **Commit messages use Conventional Commits.** The commit-msg hook enforces the format
  `<type>[(<scope>)][!]: <subject>`. See `.gitmessage` for the reference.
- **Never push directly to `main`.** Pre-push hook blocks this; open a PR with
  `gh pr create --base main --fill`.
- **Merge via squash only.** Configured at the repo level by `.github/setup-github.sh`.
- **Wait for CI after EVERY push, not just the first of a session.** `gh pr checks --watch <num>`.
  Never use `--admin` to bypass.
- **After merge, branches are auto-deleted** (repo setting).
- **Releases go through release-please.** It reads Conventional Commits on `main` and maintains a
  release PR; merging that PR tags the release. The manifest is seeded at `1.3.1`, so a `feat!`
  commit produces `2.0.0`. Do not hand-edit `package.json` versions or `CHANGELOG.md`.

`.github/setup-github.sh --trunk-only` applies branch protection, merge strategy, labels, and
default-branch settings. It has not been run yet on this repo.

## Pull request workflow

- **Never merge without Morgan's explicit approval.** The flow: discuss and plan, implement via TDD,
  open the PR when CI is green, then post a summary **with explicit manual-test steps** and WAIT.
  Morgan runs it and gives feedback; iterate until he explicitly says "merge" / "ship it". This
  applies even in `/loop` or auto mode.
- For trivial changes with no user-facing surface, you may *propose* skipping manual verification —
  as a question, not a unilateral decision.
- **Call out visible UI changes explicitly in the PR description** (screenshot if practical).
  Aesthetic quality — styling, layout, customer-visible copy, color, type, spacing, icons,
  animation — is Morgan's call, not the agent's. Never bury an aesthetic delta under "refactor" or
  "test infrastructure".

## External services and dependencies

- **Never silently swap a provisioned external service** (ephemeris, geocoder, auth, payments,
  analytics, hosting, …) to work around a bug. The default diagnosis is "the call site is wrong",
  not "the service is wrong". If a swap genuinely seems right, propose it and wait.
- Low-stakes transitive dependency swaps with no behavior change are fine — but say so in the PR for
  auditability.
- **Never commit a Morphemeris API key.** Tests that hit the live API read
  `MORPHEMERIS_API_KEY` from the environment and skip cleanly when it is absent.

## Testing discipline

This project uses test-driven development. These rules are **hard constraints**, not suggestions:

1. **Tests come before code.** For any new behavior, write the test (unit or `features/*.feature`
   scenario) first, run it, and confirm it fails for the right reason. Only then write
   implementation.
2. **A failing test means the code is wrong.** When a test fails, the default diagnosis is a bug in
   the code under test. Treat "the test is wrong" as a hypothesis that needs evidence, not the
   starting assumption.
3. **Never modify a test to make it pass.** If a test needs to change, the change is driven by a
   deliberate spec update — document the reason in the commit message, and update `plinth/specs/` to
   match.
4. **Never skip, disable, or delete a failing test to unblock yourself.** No `.skip`, `.only`, `xit`,
   `xdescribe`, `@pytest.mark.skip`, `@Ignore`, `#[ignore]`, `t.Skip`, gherkin `@skip`/`@ignore`/
   `@wip`. The `tdd-guard` hook blocks these edits globally; if the hook is ever off, the rule still
   applies. If a test seems genuinely obsolete or a skip seems genuinely warranted, ask Morgan first
   — then delete/skip with a commit message explaining why.
5. **"Done" means the full suite passes.** Run `pnpm test` before declaring a task complete.
   Type-checks and linters passing is necessary but not sufficient.
6. **Acceptance tests live in `features/`.** User-visible behaviors get a Gherkin scenario. See
   `features/README.md` for the workflow and the runner setup.
7. **Tests are first-class code.** Same quality bar for naming, structure, and review. Flaky tests
   are bugs; fix them, don't retry-loop them.

These rules exist because the worst failure mode for agent-driven development is green tests that
don't reflect reality. Keep the feedback loop honest.

The existing `src/*.spec.ts` files are jasmine-era specs from 2016. They are kept as a **behavioral
reference for the domain model**, not as a passing suite — they are not wired to a runner. Port them
to vitest rather than writing chart/aspect tests from scratch; the assertions encode real astrology.

## Current state

Project structure has been brought in line with `~/dev/new-project-scaffold/`. The NLSpec files in
`plinth/specs/` are still empty templates — drafting them via `/spec-interview` is the next step. No
stack bootstrap has run yet; see `plinth/planning/bootstrap-language.md`, and note that
`/bootstrap-typescript` is the intended command once the spec confirms the stack.
