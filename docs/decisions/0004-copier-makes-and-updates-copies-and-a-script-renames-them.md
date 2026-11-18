---
decision: 0004
status: active
date: 2026-10-18
rule: A project starts from the template with copier and pulls its later changes with copier update; the template's files stay plain, and scripts/rename-copy.ts, run as a task on every copy and update, puts the copy's name and purpose in them
touches:
  - README.md
  - vite.config.ts
  - .github/workflows/quality-gate.yaml
---

# 0004 — Copier makes and updates copies, and a script renames them

## Context

A project made with `gh repo create --template` starts as one commit with no link back: renaming it
is a hand-run checklist, and every later fix to the tooling has to be carried into each copy by
hand.

Facts as of 2026-10-18:

- Copier 9.19.1 makes a project from a git repository, asks its questions, and records the answers
  and the template commit in `.copier-answers.yml`. `copier update` renders that old commit, takes
  the copy's own changes against it, renders the new commit and applies those changes on top, with
  conflict markers where both moved the same lines.
- Copier renders only files that end in `.jinja`. The template must stay a working repo: its own
  `pnpm check`, its `AGENTS.md` read by Claude Code. An `AGENTS.md.jinja` would leave it without one.
- A copier task gets the answers and runs on every copy and on each of the three renders an update
  makes, inside directories that are not git repos yet (copier issue #2478).
- `uvx` runs copier from PyPI without installing it.
- The template carries no release tags; copier then uses `HEAD` and versions it by commit count,
  which only grows on a `main` that takes squash merges alone.

Considered and rejected:

- **`gh repo create --template` plus an init script.** One command to start, nothing to update.
- **`vp create github:…`.** It copies through degit, which reaches a private repository only over
  SSH, adds files of its own, and cannot update a copy.
- **Shared tooling as versioned packages.** Copies would update through Dependabot, but the packages
  need a registry, a token in every copy, a JS build and an exclusion from the release gate.
- **Jinja in the template's files.** It breaks the template as a repo of its own.

## Decision

- `uvx copier@9.19.1 copy --trust gh:dominikwozniak/package-template-pnpm <dir>` starts a project;
  `uvx copier@9.19.1 update --trust` pulls the template's changes into it.
- The template's files stay plain. `scripts/rename-copy.ts` puts the copy's name and purpose in
  `package.json`, `AGENTS.md`, `README.md` and `GLOSSARY.md`. It runs as a task on every copy and
  update, so the rename never shows up as the copy's own change and conflicts with nothing.
- The rename imports `node:` built-ins only, uses no git, changes nothing on a second run, and keeps
  the flags older template commits pass.
- The other tasks run once, on the copy: `git init`, `pnpm bootstrap`, the first commit and, when
  asked, the private GitHub repository with squash merges only.
- No release tags: a copy follows `main`.
- CI makes a copy without the tasks and runs its `pnpm check`.

## Trade-off

Starting a project or pulling the template's changes needs uv and the network, and `--trust` runs
the template's tasks with the user's rights. A conflict still needs a person or an agent to resolve.
The rename only finds the title and the opening paragraph it knows; a file that moves them fails
`pnpm test` in the template. In return the template stays a repo that checks itself, a copy starts
with one command, and a copy takes the tooling's later fixes as one reviewable diff.

## Revisit when

- A copy needs to stay on an older template while `main` moves on: tag releases.
- A second template appears, or the shared tooling outgrows what a diff can carry.
- Copier renders plain files, or Vite+ learns to update a copy.
