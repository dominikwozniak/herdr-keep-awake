---
decision: 0001
status: active
date: 2026-10-17
rule: Formatting, linting, type-checking, tests and the pre-commit hook run through Vite+ (`vp`), configured in `vite.config.ts` alone, with no separate oxlint, oxfmt, typescript, vitest, lint-staged or husky dependency
touches:
  - vite.config.ts
  - package.json
  - tsconfig.json
  - .vite-hooks/
---

# 0001 — Vite+ is the one toolchain

## Context

The repos this template grows from (grateful-me-asc, foundation, dw-sdlc) run the same chain from
separate parts: oxlint and oxfmt with their own config files, `tsc` for the type-check, `node:test` or
Vitest, lint-staged behind husky. Each part is a pinned devDependency that moves on its own, and each
config file travels with every copy.

Facts as of 2026-10-17: `vite-plus` 1.0.0 shipped 2026-09-28, and 1.1.0 (2026-10-07) is the newest
release older than the 7-day release gate. It bundles oxlint 1.87.0, oxfmt 0.72.0, Vitest 5.0.3 and
tsgolint 7.0.2003, which type-checks with its own TypeScript 7. Its `vp config` installs git hooks
the way husky 9 does, and `vp staged` runs lint-staged's job.

Considered and rejected:

- **The separate tools, as in asc.** Proven in four repos, but six devDependencies and three config
  files per copy, and a type-check that runs apart from the lint.
- **Vite+ behind husky.** `vp config` skips installing while `core.hooksPath` points elsewhere, so
  husky would replace Vite+'s installer rather than wrap it, for the same job and one more pin.

## Decision

- `vite-plus` is the one tool devDependency, pinned exactly; `vp` runs from `node_modules`.
- `vite.config.ts` holds `fmt`, `lint` (type-aware, with the type-check), `test` and `staged`; no
  other tool config file exists.
- Git hooks are Vite+'s: `prepare` runs `vp config --no-agent`, and `.vite-hooks/pre-commit` runs
  `vp staged`.
- `pnpm check` runs `vp check`, `vp test` and `agents:check`; CI runs `pnpm check`.

## Trade-off

One vendor's release decides when oxlint, oxfmt, Vitest and the type-checker move, and the release
gate adds 7 days on top: a fix in a bundled tool waits for both. Vite+ is weeks past 1.0, so viteplus.dev
runs ahead of the pinned version; the clone under `references/vite-plus/` sits at the installed
version's tag (decision 0003) and is the way to read what ships. In return a copy carries one tool pin and one config file, and the check is one
command that formats, lints and type-checks in one pass.

## Revisit when

- A bundled tool trails its upstream by more than a month.
- A project needs a lint rule, formatter option or test feature Vite+ does not expose.
- `vite-plus` 2.0 changes the config shape or the hook mechanism.
