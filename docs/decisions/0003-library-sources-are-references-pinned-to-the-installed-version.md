---
decision: 0003
status: active
date: 2026-10-17
amended-by: 0005
rule: A library's source an agent reads is a row in references/AGENTS.md whose ref is the tag of the version package.json pins, synced like any reference and searched by its path; never a vendored subtree under repos/
touches:
  - references/AGENTS.md
  - .ai/references.json
  - .gitignore
---

# 0003 — Library sources are references pinned to the installed version

## Context

An agent writes better code against a library when it reads that library's source than when it
guesses from docs, a web search or the compiled files in `node_modules`. Effect's blog post "The one
weird git trick that makes coding agents more Effect-ive" vendors the source with
`git subtree add --prefix=repos/effect ... --squash` and tells the agent to read `repos/` first.
dw-mc does exactly that.

Facts as of 2026-10-17:

- dw-mc's `repos/effect/` holds 4044 files and 52 MB, carried in every clone and in its history. It
  moves only by a hand-run `git subtree pull`, so it drifts from the `effect` version installed.
- GitHub's dependency graph parses manifests anywhere in a repo except under directories named like
  `vendor/` or `third_party/`. A vendored `repos/effect/pnpm-lock.yaml` would raise Dependabot alerts
  for code this repo never runs.
- A tracked subtree also ships the upstream's `.claude/skills/`, which load once the agent reads a
  file there; `claudeMdExcludes` covers `CLAUDE.md` and `AGENTS.md`, not skills. Formatter, linter,
  TruffleHog and editor each need it excluded.
- `references/` already clones repositories for reading: gitignored, shallow, sparse, synced at
  session start. Its one gap against a subtree is search. Grep, and the `grep` Claude Code runs
  through Bash, skip gitignored paths, so a search from the repo root finds 1 file for
  `VP_GIT_HOOKS` and the same search in `references/vite-plus` finds 9. File finding sees both.
- Upstreams tag their releases: `v1.1.0` for vite-plus, `effect@4.0.5` for Effect.

Considered and rejected:

- **A `repos/` subtree, as in dw-mc and the post.** It works offline and in CI, at the costs above.
- **References at a branch head only.** The clone runs ahead of the installed version, as
  `references/vite-plus` did on `main`, and the agent reads features the repo does not have.

## Decision

- A library's source is a row in `references/AGENTS.md` whose `ref` is a tag with `{package}` in
  it, such as `v{vite-plus}`; `pnpm references:sync` replaces it with the exact version
  `package.json` pins and checks that tag out. A Dependabot bump moves the clone at the next sync.
- A `{package}` that `package.json` does not pin exactly fails its row (decision 0002).
- The router tells the agent to read a library's source before its docs, and to search a clone by
  its path.
- No `repos/` directory and no `git subtree` in a project made from this template.

## Trade-off

The source needs the network once per version and is absent offline, in CI and in a fresh clone
until the sync runs; a search from the root misses it unless the agent names the path. A library
that does not tag its releases can only be read at a branch head. In return a copy carries no
vendored bytes, no false Dependabot alerts and no foreign skills, and the source always matches the
installed version.

## Revisit when

- A project needs a library's source offline or in CI.
- Claude Code's search starts reading gitignored paths, or stops.
- A library the project leans on publishes no release tags.
