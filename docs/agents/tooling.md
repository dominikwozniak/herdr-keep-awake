# Tooling

What `vite.config.ts`, `package.json` and `pnpm-workspace.yaml` do not say. Why the tooling looks this
way: decision 0001 (Vite+), decision 0002 (the release gate) and decision 0004 (copier).

## Vite+

- A tool option goes into `vite.config.ts`, never into a `.oxlintrc.json`, `.oxfmtrc.json`,
  `vitest.config.ts` or `tsdown.config.ts`.
- tsgolint type-checks with its own TypeScript 7: there is no `typescript` devDependency.
- A `warn` fails `vp check` just as an `error` does (`denyWarnings`).
- `ignored` holds what the repo does not own (clones, vendored skills and rules, worktrees,
  per-machine files); fmt, lint and the type-check all skip it.
- `staged` passes `--no-error-on-unmatched-pattern`: without it, a commit of only `ignored` files fails
  the hook.
- `vp config` runs with `--no-agent`, as `prepare` does: without it, it rewrites `AGENTS.md`.
- `pnpm exec vp hooks status` shows whether the hooks are live; `VP_GIT_HOOKS=0` turns them off for
  one process.

## TypeScript and tests

- A file outside `tsconfig.json`'s `include` is type-checked with loose defaults, so a new directory of
  code goes into `include`.
- Tests import from `vite-plus/test` and run real files, git and temp directories; only a script's
  `Tools` is faked (`scripts/bootstrap.ts`).

## The Gate

- `pnpm check` runs `dw-sdlc gate`: the Steps `vp check`, `references:setup --check` and `vp test`,
  then every Check under `gate.checks` in `.ai/agentic.config.json`, each one even when another fails.
- `pnpm exec dw-sdlc check <name>` runs one Check alone. A failure line names the file and its remedy.
- `agents-check` is the repo's own Check, `scripts/agents-check.ts`; the others ship with `dw-sdlc`.
- `.ai/primitives.json` maps the code under `scripts/` and `tools/` to the docs to read before changing it;
  `pnpm exec dw-sdlc primitives --paths <file>` answers for one path. A new script falls under the
  `scripts` entry; it gets one of its own once it has docs to point at.
- `file-size-ratchet` holds source to 500 lines and tests to 2000. A file over its
  limit goes into `.ai/file-size-ratchet.baseline.json` at its count, which
  `pnpm exec dw-sdlc gate --update-baseline` only lowers.
- `dw-sdlc` stays at the version the sdlc plugin runs; `pnpm exec dw-sdlc doctor` compares the two.

## Vendored lint rules

- `tools/oxlint/anti-slop/` is upstream code. Its `UPSTREAM.md` says what was taken, why the rest is
  off, and how to take another rule or refresh. Its imports read `vite-plus/lint/plugins`, because a
  direct `@oxlint/plugins` does not resolve under pnpm's strict layout.

## Dependencies

- A just-published version fails `pnpm add` by design: pick the newest one older than 7 days
  (`pnpm view <pkg> time --json`).
- A `trustPolicy` refusal is fixed by a pin in `overrides`, with a comment naming why and when it goes,
  never by an exclusion.
- A dependency's install script fails the install until `allowBuilds` names it; `true` there means
  someone read the script.

## Worktrees and CI

- A worktree from `git worktree add` runs no hook, silently, until `pnpm install`; one from
  `claude -w` fails every commit until then.
- Every action is pinned to a full commit SHA with a `# vX.Y.Z` comment, the org's own reusable
  workflows included, and Dependabot moves the pins; the `pinned-actions` Check holds it.

## The template

- `copier.yml` holds the questions a new copy answers and the tasks that set it up. Only the rename,
  `scripts/rename-copy.ts`, runs on every copy and update; the rest run once, on the copy.
- The rename runs from the template's clone, with no `node_modules`, inside directories that are not
  git repos yet: it imports `node:` built-ins only, uses no git, and a second run changes nothing.
- An update replays the copy's old template commit with that commit's rename, so a change to the
  script keeps the flags older commits pass. A title or an opening paragraph the rename no longer
  finds fails `pnpm test`.
- `copier.yml` and the rename are left out of a copy, so the Project map never names them: the
  `agents:check` of every copy would fail.
- Try a change on a local copy, `uvx copier@9.19.1 copy --trust --vcs-ref HEAD --data github=false .
  <dir>`; CI's `Copy` job makes one without the tasks and runs its `pnpm check`.

## When the project becomes a package

Drop `private`, add a `pack` block to `vite.config.ts` (`references/vite-plus/docs/guide/pack.md`), a
`build` script running `vp pack` and `files` in `package.json`; add `pnpm exec vp pack` to `gate.steps`
and write a decision record for the release flow.
