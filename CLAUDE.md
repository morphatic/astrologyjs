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
  release PR; merging that PR tags the release and publishes it. See "Releasing and publishing".
- **A breaking change must be marked in a commit that lands on `main`** — `feat!:` in the subject, or
  a `BREAKING-CHANGE:` footer. Putting `!` only in a *pull request title* is not enough unless the PR
  is squash-merged, because a merge commit preserves the branch's individual commit messages and
  discards the PR title. This has already bitten once: see the note in "Releasing and publishing".

## Releasing and publishing

One workflow, `.github/workflows/publish.yml`, is the whole pipeline:

1. Land Conventional Commits on `main` (the commit-msg hook already enforces the format).
2. release-please maintains a release PR with the version bump and generated `CHANGELOG.md`.
3. Merging that PR tags the release **and publishes to npm in the same run**.

**Never publish from a laptop**, and never hand-edit `package.json` versions or `CHANGELOG.md`.

Publishing uses **npm trusted publishing (OIDC)**. There is no `NPM_TOKEN`: npm authenticates the
workflow itself against a trusted publisher configured on npmjs.com, so nothing expires, rotates, or
leaks, and provenance attestations are attached automatically.

Four things this depends on, all easy to break:

- **The trusted publisher on npmjs.com** must name repository `morphatic/astrologyjs` and workflow
  `publish.yml`, with `npm publish` ticked as an allowed action. **Renaming the workflow file breaks
  releases.** Configurations created after 2026-05-20 require at least one allowed action, so
  leaving that box untouched is a publish failure.
- **Release and publish must stay in one workflow.** release-please creates the tag and release with
  the default `GITHUB_TOKEN`, and GitHub does not start workflow runs from `GITHUB_TOKEN` events, so
  a separate workflow on `push: tags` or `release: published` would never fire — silently, with no
  red run. Keeping both jobs here lets publish gate on release-please's own `release_created`
  output. Splitting them into a reusable workflow breaks it differently: npm validates the *calling*
  workflow's filename, so the called file's name is never what is checked.
- **The workflow upgrades npm before publishing**, because trusted publishing needs npm CLI ≥ 11.5.1
  and Node 22 ships npm 10.x. Removing that step produces an `ENEEDAUTH` failure that reads like a
  missing token.
- **The publish step uses `npm publish`, not `pnpm publish`** — pnpm's OIDC support is unreliable
  across majors ([pnpm#11513](https://github.com/pnpm/pnpm/issues/11513)). Install, typecheck, lint,
  test, and build stay on pnpm.
- **`pnpm/action-setup` must be given `version: 10`**, as in `ci.yml` and `audit.yml`. The action has
  no default and this repo declares no `packageManager` field, so omitting it fails with "No pnpm
  version is specified" before anything installs. This is the one thing that cannot be copied
  verbatim from `@morphemeris/mcp`, whose package.json does declare it.

A version number is spent permanently once published — npm does not allow replacing one — so before
the registry is touched the workflow runs the full gate, refuses outright if the version already
exists, and smoke-tests the packed tarball by installing and importing it. That last check exists
because 1.x's defining failure was a package that installed fine and did not work.

`workflow_dispatch` is the recovery hatch if a release is tagged but the publish fails. It is safe to
re-run: the republish guard makes it a no-op once the version is live.

### Approving the release PR's workflows is deliberate

Once branch protection is on, release-please's own pushes do not start workflow runs — GitHub does
not trigger workflows from `GITHUB_TOKEN` events — so CI on the release PR sits at
`action_required` with a "1 workflow awaiting approval" banner that names no workflow. Two ways
forward, both fine: click **Approve workflows to run**, or click **Update branch**, which pushes with
a human token and starts CI normally. Branch protection is `strict`, so the branch usually needs
updating anyway.

**Do not engineer this away.** Morgan has looked at it and wants it kept: it suppresses CI runs on a
release PR that is regenerated on every merge but not yet meant to ship, and it forces a human to
watch CI go green immediately before an irreversible publish. That is a ritual, not friction. The
same reasoning applies to any manual gate sitting in front of an action that cannot be taken back.

One banner is usually the `Dependabot auto-merge` workflow, which fires on every `pull_request` and
then skips, because its job is gated on `github.actor == 'dependabot[bot]'`. Approving it is
harmless and does nothing. It is not what gates the merge — the required context is
`CI (required check)`.

### If a release wedges

Symptom: the release PR merges, the workflow is green, and there is no tag, no GitHub release, and
no publish. The run says `There are untagged, merged release PRs outstanding - aborting`, usually
alongside `Expected 1 releases, only found 0` and `PR component: undefined does not match configured
component`.

This does not clear itself. Every later run aborts the same way, so releases stay stuck until a
human creates the missing tag. What the merge *does* get right is the version bump: `package.json`,
`.github/.release-please-manifest.json` and `CHANGELOG.md` are all correct on `main`. Only the tag
is missing, and the release and publish both follow from it.

Recovery, in order:

1. `gh release create v<version> --target <release commit> --notes-file <the new CHANGELOG section>`
2. Relabel the merged release PR `autorelease: pending` → `autorelease: tagged` (via
   `gh api -X DELETE/POST .../issues/<n>/labels`, since `gh pr edit` needs a `read:project` scope
   the local token lacks). Skipping this leaves release-please seeing outstanding work.
3. Publish with `workflow_dispatch`, since `release_created` never fired.

Beware of misreading the cause. The `pullRequestTitlePattern miss the part of '${component}'`
warnings appear on every run in manifest mode and are **not** the problem; removing the custom
pattern changes nothing. The missing tag is the problem.

### Getting the version right

release-please derives the version from commit messages, so the version is only as correct as the
messages that reached `main`.

**2.0.0 nearly shipped as 1.4.0.** PR #9 was titled `feat!: rebuild astrologyjs on the Morphemeris
API`, but it was merged as a *merge commit*, so only the branch's own commits landed — all `feat:`
and `fix:`, none marked breaking. release-please saw a minor bump and proposed 1.4.0 for a release
that is ESM-only, changes `Aspect.orb` semantics, and removes `Planet.symbol` and the `Chart`
constructor. Anyone on `^1.3.1` would have been upgraded into a rewrite without warning.

The root cause was that `.github/setup-github.sh` had not been run, so squash-only merging was not
enforced at the repo level and PR #9 landed as a merge commit. With squash merging the PR title
becomes the commit subject and the `!` survives. **This is fixed** — see below — so the specific
trap that produced it is closed, but the habits below still matter because a wrong version is only
free to fix before the release PR is merged.

Two habits that prevent a repeat:

- **Read the version on the release PR before merging it.** That PR is the checkpoint, and the
  proposed version is stated in its title and body. A wrong version there is free to fix; a wrong
  version on npm is permanent.
- To force a version regardless of what the commit history implies, land a commit on `main` whose
  **body** contains `Release-As: x.y.z` (case-insensitive). That is what corrected this one.

`.github/setup-github.sh --trunk-only` applies branch protection, merge strategy, labels, and
default-branch settings. It **was run on 2026-08-15**, and the settings are live: squash is the only
merge method (merge commits and rebase are both disabled), branches auto-delete on merge, and `main`
requires the `CI (required check)` status with `enforce_admins` on. Zero required reviewers, which is
correct for a single-maintainer repo — the human gate is Morgan's explicit approval, not GitHub's.

Two consequences worth knowing before you fight them:

- `enforce_admins` means `--admin` cannot bypass a red CI run. That is deliberate.
- Merge commits are no longer possible, so a PR title's `feat!` now always reaches `main`. The
  failure that produced 1.4.0 cannot recur through that route.

### The `legacy/1.x` branch, and the second `publish.yml`

`legacy/1.x` is a frozen branch off `v1.3.1` carrying `astrologyjs@1.3.2`, a tombstone whose only
behavior is to throw an error explaining that 1.x is retired. It was published 2026-08-15. It is
never merged into `main` and shares no code, no toolchain, and no dependency tree with 2.x.

**There are two different files at `.github/workflows/publish.yml`.** `main`'s releases 2.x through
release-please. `legacy/1.x`'s publishes the 1.x tombstone by hand. They share a filename because
they have to: npm's trusted publisher names the workflow `publish.yml` and validates the filename of
the workflow that actually calls it, so `publish-legacy.yml` would not authenticate. They are told
apart by ref, and the legacy one's first step refuses to run unless `GITHUB_REF` is
`refs/heads/legacy/1.x`. Editing "the publish workflow" without checking which branch you are on is
the mistake this section exists to prevent.

Three things that were verified rather than assumed, so nobody has to re-derive them:

- **npm trusted publishing does not pin a branch.** The config names organization, repository,
  workflow filename, and optionally environment. `gh workflow run publish.yml --ref legacy/1.x`
  authenticates and attaches provenance normally.
- **`npm publish` moves `latest` to whatever was published most recently, ignoring semver.** A bare
  publish of 1.3.2 would have pointed every `npm install astrologyjs` at the tombstone and
  effectively unpublished 2.x. `--tag legacy` is load-bearing, and the workflow reads `latest`
  before and after and fails the run if it moved. Dist-tags do not affect range resolution, so
  `^1.3.1` still resolves to 1.3.2 — which is the entire point of shipping it.
- **Trusted publishing authorizes `npm publish` only.** `npm deprecate` and `npm dist-tag` still
  need an interactive login, so they stay manual.

Working-tree note: `main` and `legacy/1.x` have completely different dependency trees. Switching
between them requires `pnpm install`.

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
