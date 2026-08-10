# Language / Stack Bootstrap

This project was scaffolded without a language or stack committed. Once the stack is chosen (usually via `/spec-quick` or `/spec-interview`), run the matching `/bootstrap-*` slash command.

## Run the right slash command

Ordered by stack. Framework commands automatically run their language prerequisites — don't run them separately.

| Stack | Command |
|-------|---------|
| Rust | `/bootstrap-rust` |
| Python (services, CLIs, libraries) | `/bootstrap-python` |
| Python (data science, pipelines, data quality) | `/bootstrap-python` — detects the data profile and layers on the dataframe + data-contract stack |
| TypeScript (Node.js, libraries, CLIs) | `/bootstrap-typescript` |
| Next.js (App Router) | `/bootstrap-nextjs` — runs the TypeScript bootstrap first, then adds Next.js |
| Tauri v2 (desktop + optional mobile) | `/bootstrap-tauri` — runs Rust and TypeScript bootstraps first, then adds Tauri |

Each command:

1. Loads the binding coding standards from `~/dev/new-project-scaffold/templates/coding-standards/coding-standards-<lang>.md`.
2. Copies those standards into `plinth/coding-standards-<lang>.md` so they live with the repo.
3. Checks current stable versions at runtime — **never** trusts version numbers in training data or documentation.
4. Installs blessed tooling, writes config files, uncomments the matching CI block, adds a minimal failing test, and updates release-please for the right release-type.

## If your stack isn't listed

The following stacks don't have bootstrap commands yet — if you hit one, build the command from the pattern in the existing five, and add a `coding-standards-<lang>.md` via research:

- Go
- SvelteKit
- Others on demand

## After bootstrap

- Delete this file — it has done its job.
- `CLAUDE.md` should reference the relevant `plinth/coding-standards-*.md` files so they're loaded every session.
