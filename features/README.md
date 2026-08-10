# features/

Executable acceptance tests in Gherkin syntax. These complement — not replace — the NLSpec in `plinth/specs/`.

## Relationship to the NLSpec

- **`plinth/specs/*.nlspec.md`** is the binding contract. Natural-language, comprehensive, the source of truth.
- **`features/*.feature`** translates user-visible behaviors from the spec into scenarios a step runner can execute.
- When a feature scenario disagrees with the spec, the spec is right until deliberately updated. Fix the feature (or fix the spec if the spec has drifted from intent).

Not every spec section needs a feature file. Add one per user-visible behavior that's worth pinning as an executable acceptance test. Pure internal refactors don't need features.

## Runner setup

The step runner is language-specific. The `/bootstrap-<lang>` commands wire up the right one:

| Stack | Runner | Why | Step-definition location |
| ----- | ------ | --- | ------------------------ |
| Rust (CLI / lib / backend) | [`cucumber-rs`](https://github.com/cucumber-rs/cucumber) | No UI — Gherkin pins domain logic. | `tests/cucumber.rs` |
| TypeScript (CLI / lib) | [`@cucumber/cucumber`](https://github.com/cucumber/cucumber-js) | No UI — lightweight, no browser. | `features/steps/` |
| Next.js | [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) | UI app — scenarios are user-visible flows, need a real browser. | `features/steps/` (async, receive Playwright fixtures) |
| Tauri (frontend-only) | [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) | Webview UI — drives frontend in Chromium with IPC mocked via `@tauri-apps/api/mocks`. | `features/steps/` + `features/support/tauri-mocks.ts` |
| Python (CLI / lib / pipeline / API) | [`pytest-bdd`](https://github.com/pytest-dev/pytest-bdd) | No UI — runs inside pytest, so fixtures, coverage, and plugins apply to steps. | `tests/features/` |
| Go | [`godog`](https://github.com/cucumber/godog) | _(bootstrap not yet built)_ | `features/` (Go files alongside) |

**Rule of thumb:** if the project has a browser UI, use `playwright-bdd`. Otherwise use the language's plain cucumber runner. Full desktop E2E for Tauri (real window, native menus) is a separate, heavier setup — `tauri-driver` + WebdriverIO — not covered here.

If the bootstrap command for your stack hasn't wired a runner yet, add one following the stack's convention.

## Writing scenarios

- **Keep scenarios declarative.** `When the user submits a valid order` — not `When the user clicks #submit-btn`.
- **One behavior per scenario.** If you need `And` three times in `Then`, split it.
- **Use `Scenario Outline`** for the same behavior across many inputs.
- **Tag sparingly.** Tags like `@slow` or `@integration` are useful for selective runs. Do not use `@skip`, `@ignore`, or `@wip` to disable broken scenarios — the `tdd-guard` hook will block that. Fix the underlying code instead.

## Running

Whatever `pnpm test` / `cargo test` runs should include the feature suite. The `/bootstrap-<lang>` commands are responsible for making that true.
