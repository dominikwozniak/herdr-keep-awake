# anti-slop, vendored

Eleven oxlint rules from [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop) at commit
`c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b` on `main`, dated 2026-09-10. Upstream ships no package and is
meant to be copied, so this directory is the installation, under upstream's MIT licence (`LICENSE`).

## Taken

Upstream's paths with the leading `src/` dropped. Each rule comes with its test beside it.

- `rules/no-chained-type-assertions.ts`
- `rules/no-conditional-empty-object-spread.ts`
- `rules/no-module-mocking.ts`
- `rules/no-object-parameters.ts`
- `rules/no-reduce-accumulator-copy.ts`
- `rules/no-reflect-apply.ts`
- `rules/no-shape-in-symbol-names.ts`
- `rules/no-unknown-returns.ts`
- `rules/no-unknown-type-aliases.ts`
- `rules/no-widen-then-assert.ts`
- `rules/require-safety-comment-for-type-assertion.ts`
- `shared/array-method.ts`, `shared/function-parameters.ts`, `shared/lexical-type-parameters.ts`,
  `shared/reflect-method.ts`, `shared/scope.ts`, `shared/type-alias-resolution.ts` — the helpers those
  rules import

## Local edits

- Every `@oxlint/plugins` import reads `vite-plus/lint/plugins`, and every `oxlint/plugins-dev` import
  reads `vite-plus/lint/plugins-dev`. Vite+ re-exports both and ships the oxlint that loads this plugin; a
  direct dependency would not resolve under pnpm's strict layout.
- `index.ts` registers the eleven rules taken. Upstream's registers eighteen.

Nothing else differs from upstream.

## Not taken

- `no-runtime-typeof`, `no-known-value-widening`, `no-unknown-parameters`, `no-unsafe-dictionary-type`
  and `no-reflect-get` want input parsed by a schema at the boundary. `scripts/` parses JSON by hand, and
  they report 18 findings there. A project that takes a schema library turns them on.
- `no-array-filter-map` reports one finding (`scripts/agents-check.ts:49`).
- `require-readable-spacing`: formatting belongs to `vp fmt`, and upstream issue #54 reports CPU spikes.
- The `anti-slop-effect` plugin: the template does not depend on `effect`.

## Upkeep

- **Taking another rule.** Copy its file, its test and the `shared/` files it imports from the commit
  above. Rewrite the two imports. Register it in `index.ts`, fix what it reports, then add it to
  `vite.config.ts` at `error` and to the list above.
- **Refreshing.** Treat it as a reviewed merge, not a directory swap (upstream's
  `skills/install-anti-slop/references/update.md`). Pick a `main` commit at least 7 days old and fetch
  it into a scratch directory. Diff the taken files against the commit above and port the changes.
  Rewrite the two imports again, and keep the local rule list and severities. Record the new commit
  here and run `pnpm check`.
- oxlint's JS plugin API is alpha and outside its semver, so a `vite-plus` bump can break a rule. The
  tests here run in `pnpm check` through `tools/oxlint/rule-tester.setup.ts`.
- This directory sits in `ignored` and outside `tsconfig.json`'s `include`, so fmt, lint and the
  type-check leave upstream's style alone.
