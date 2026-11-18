---
decision: 0005
status: active
date: 2026-10-30
rule: pnpm check runs dw-sdlc gate, and .ai/references.json declares the References dw-sdlc clones; the repo keeps its own code only for what the package does not check, scripts/agents-check.ts
touches:
  - package.json
  - pnpm-workspace.yaml
  - .ai/agentic.config.json
  - .ai/references.json
  - .ai/primitives.json
  - references/AGENTS.md
  - scripts/agents-check.ts
---

# 0005 — The dw-sdlc package runs the Gate and syncs the References

## Context

The template carried its own References sync, `scripts/references-sync.ts` with its test and a
SessionStart hook, and a `pnpm check` chain of `vp check`, `vp test` and `agents:check`. The owner's
`dw-sdlc` package, which the sdlc plugin runs, ships:

- the same sync, driven by `.ai/references.json`, with `{name}` tags read from `package.json`,
  sparse `skip` and `only` paths, and a lock between concurrent runs;
- a SessionStart hook in the sdlc plugin that runs that sync;
- a Gate whose Checks this repo lacked: markdown links, changelog language, comment and file size,
  decision records, the Primitives catalogue and the agent map.

`agents-map`, the package's check of `AGENTS.md`, does not hold the `CLAUDE.md` links, the Project
map's paths or the Agent skills table; `scripts/agents-check.ts` does.

Considered and rejected:

- **Keep the repo's own sync.** Two implementations of one job, and the plugin's hook runs beside the
  repo's.
- **Drop `agents-check` for `agents-map`.** It loses the three checks above.

## Decision

- `pnpm check` is `dw-sdlc gate`. Its Steps are `vp check`, `pnpm references:setup --check` and
  `vp test`; its Checks are every one the package ships, plus `agents-check` as a `run` Check.
- A Reference is an entry of `.ai/references.json`. `pnpm references:setup` writes the table in
  `references/AGENTS.md` from it, and `pnpm references:sync` clones it. This amends decision 0003: a
  library's source is an entry of that file, not a row typed into the table.
- `dw-sdlc` is pinned at the version the sdlc plugin runs and excluded from the release gate, the
  exception decision 0002 allows, commented in `pnpm-workspace.yaml`.

## Trade-off

The Gate and the sync change with a package outside this repo, and a `dw-sdlc` release lands without
the 7-day wait: one can turn the Gate red or change how the clones move. Every copy depends on
`dw-sdlc` as a devDependency. In return the repo keeps no sync code, test or hook of its own.

## Revisit when

- `dw-sdlc` stops being maintained, or someone other than the owner publishes it.
- A Check misjudges this repo more often than it catches a real problem.
