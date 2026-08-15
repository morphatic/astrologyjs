# TypeScript coding standards

Binding guidelines for TypeScript code in this project. Load this file at the start of any TypeScript work session.

**Primary sources:**

1. [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) — comprehensive, opinionated, actively maintained.
2. [`tsconfig/bases`](https://github.com/tsconfig/bases) — community-standard strictness baselines (`strictest.json`, `node-lts.json`, etc.).
3. [`typescript-eslint` shared configs](https://typescript-eslint.io/users/configs/) — canonical lint baseline (`strict-type-checked`, `stylistic-type-checked`).

Do NOT use Microsoft's TypeScript coding guidelines as a general reference — that document is explicitly scoped to compiler contributors (its "use undefined, not null" rule is only for the TS compiler codebase).

## Strictness baseline

`tsconfig.json` extends `@tsconfig/strictest` plus the runtime base (`@tsconfig/node-lts`, `@tsconfig/next`, etc.). Strictest enables:

- `strict`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- `noUnusedLocals`, `noUnusedParameters`
- `isolatedModules`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`

Additionally set: `verbatimModuleSyntax: true` (forces explicit `import type`), `target: "ES2022"` or newer, and `moduleResolution` to match your runtime.

## Types

- **`any` is banned.** Use `unknown` for genuinely unknown input; narrow before use. If `any` is unavoidable, confine it to one expression with `// eslint-disable-next-line` + a reason.
- **Discriminated unions for state.** Model states as `{ kind: 'ok'; value: T } | { kind: 'err'; error: E }`. Make invalid states unrepresentable. (Effective TS Items 29, 32.)
- **`readonly` everywhere not intentionally mutable.** `ReadonlyArray<T>` / `readonly T[]` on params you don't mutate. `as const` for literal tuples and lookup tables.
- **No `enum`.** Use `as const` object literals instead. `enum` emits runtime values and interacts badly with `isolatedModules`.
- **`interface` vs `type`:** `interface` for object shapes that may be extended or implemented; `type` for unions, tuples, mapped/conditional types, and function signatures. Be consistent per file.

## Null / undefined

Prefer `undefined` for "not provided / not set" — matches `?` optional semantics, `exactOptionalPropertyTypes`, and `JSON.stringify` behavior. Use `null` only when interfacing with APIs that emit it. Never mix: don't return `T | null | undefined`.

## Naming

- `PascalCase`: classes, types, interfaces, enums, enum members.
- `camelCase`: variables, parameters, functions, methods, properties.
- `UPPER_SNAKE_CASE`: only true top-level constants that are primitive or deeply-frozen.
- No `I` prefix on interfaces. No `_` prefix on private fields — use `private` or `#private`.
- File names: `kebab-case.ts` (default choice).

## Modules

- **Named exports only.** Ban default exports via `import/no-default-export` — except where a framework requires them (e.g. Next.js `page.tsx`, `layout.tsx`).
- **No barrel files for internal use.** They create circular-dependency hazards, slow tsc, and defeat tree-shaking. Allow barrels only at a package's public API boundary.
- Enforce `import/no-cycle`.
- Use `@/*` path aliases via `tsconfig.paths`.

## Error handling

- Throw `Error` subclasses for exceptional conditions. Never throw strings or objects.
- For expected domain failures (validation, business rules, network), prefer a Result/Either pattern — either a discriminated union or `neverthrow`'s `Result<T, E>`. Per project judgment.
- Attach `cause` when rethrowing: `throw new FooError(msg, { cause: err })`.

## Async

- `await` every Promise you don't explicitly delegate. ESLint `@typescript-eslint/no-floating-promises` as error.
- Don't pass an async function where a sync callback is expected (`no-misused-promises`).

## Tooling

- **Formatter:** Prettier with `singleQuote`, `semi`, `trailingComma: 'all'`, `printWidth: 100`.
- **Linter:** `eslint` flat config composing `@eslint/js`, `tseslint.configs.strictTypeChecked`, `tseslint.configs.stylisticTypeChecked`, and `eslint-config-prettier` last.
- **Scripts:** `typecheck` = `tsc --noEmit`; `lint` = `eslint .`; `format:check` = `prettier --check .`; CI runs them in that order before `test`.

## Judgment calls this doc has already made

- `interface` for shapes / `type` for everything else (Google's side of the debate).
- `undefined` is the "absent" value (not `null`).
- Ban barrel files for internal use.
- Ban `enum`; use `as const` objects.
- `neverthrow` / Result pattern is opt-in per project, not default.
