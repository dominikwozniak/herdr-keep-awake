# herdr-keep-awake — agent rules

> `CLAUDE.md` is a symlink to this file — edit `AGENTS.md`. Budget: **10 KB**, held by the
> Gate's `agents-map` Check. A topic that outgrows a line moves to `docs/agents/` with a Task Router row.

A Herdr mod: a switch in the tab bar that keeps your Mac and its display awake while your coding agents work.

## Project map

- `mods/keep-awake/` — the mod, plain JavaScript Herdr loads: `mods/keep-awake/main.js` the switch,
  `mods/keep-awake/awake.js` what it runs and how it reads hc, free of Herdr's modules; all of it
  ships, so its tests live in `tests/`
- `RECIPE.md` — the brief another agent builds the mod from; `keys.json` — the key it expects;
  `preview.png` — the gallery's picture
- `scripts/` — the repo's tooling: one TypeScript file per script, run by Node through a `package.json` script,
  its test beside it. `scripts/script.ts` holds what every script shares; a script that calls what a
  test cannot touch takes `Tools`, the one seam a test fakes (`scripts/bootstrap.ts`)
- `vite.config.ts` — the only tool config: `fmt`, `lint`, `test`, `staged`
- `tools/oxlint/anti-slop/` — vendored anti-slop lint rules; read UPSTREAM.md there before a change
- `pnpm-workspace.yaml` — pnpm's settings: the release gate, trust policy, builds, audit level
- `docs/agents/` — the how-tos the Task Router sends you to; `docs/decisions/` — decision records;
  `GLOSSARY.md` — the repo's terms
- `.agents/skills/` — the vendored skills; `.claude/` — settings, `.claude/skills/` links to them
- `.ai/agentic.config.json` — read by the sdlc plugin's guards and the Gate; `.ai/primitives.json` —
  the code each path belongs to; `.worktreeinclude` — what a worktree Claude Code creates gets; any new
  worktree starts with `pnpm install`
- `.vite-hooks/` — `pre-commit` runs `vp staged`, `pre-push` runs `pnpm check` unless the push only
  deletes branches
- `references/` — repositories cloned for reading, never tracked; `.ai/references.json` declares
  them, `references/AGENTS.md` routes to them
- `.github/` — CI, secrets scans, a weekly `pnpm audit`, Dependabot and the PR template

## Never

- Never edit, build, lint or import from `references/` — read-only clones.
- Never lower the release gate in `pnpm-workspace.yaml`, add an exclusion to it, or bypass it with
  `--config.minimumReleaseAge=0` without asking.
- Never point a tracked file at `ideas/`: local notes, gitignored.

## Tooling

- **pnpm only**, pinned in `packageManager` — never `npm`, `npx`, `yarn` or `bun`; one-off tools via
  `pnpm dlx`. Dependencies are pinned exactly (`pnpm add -E`).
- **Vite+ is the toolchain** (decision 0001): `vp` from `node_modules`, through the `package.json`
  scripts or `pnpm exec vp`. Formatting and import order belong to `vp fmt`.
- **TypeScript runs natively on Node 24** — `node scripts/<name>.ts`, no build step. Erasable syntax
  only (no `enum`, `namespace` or parameter properties); relative imports keep the `.ts` extension.

<important if="you are committing, pushing, or opening or merging a pull request">

## Git

- Conventional Commits and a `Co-Authored-By` trailer on every agent commit; the sdlc plugin
  enforces both from `.ai/agentic.config.json`. Stage by name, never `git add -A` or `git add .`.
- `main` is protected: the sdlc plugin refuses an agent's push there. A change reaches it through a
  branch and a pull request whose body fills `.github/PULL_REQUEST_TEMPLATE.md`. The agent pushes
  the branch, opens the PR and, once its checks pass, merges it with `gh pr merge --squash`; one
  commit per PR on `main`, titled as the PR.
- A red `pnpm check` blocks the push: the private repo has no branch protection, so the pre-push
  hook is the gate and CI reports the same check.

</important>

## Agent skills

Matt Pocock's engineering skills, vendored in `.agents/skills/` and pinned by hash in
`skills-lock.json`. Never edit them; `pnpm dlx skills update -p -y` updates them.

| skill                           | reach for it when                                                           |
| ------------------------------- | --------------------------------------------------------------------------- |
| `grilling`                      | a plan or an idea needs stress-testing before anything is built             |
| `grill-with-docs`               | the same, writing `GLOSSARY.md` and decision records as answers settle      |
| `domain-modeling`               | a term or a decision is settled: the glossary entry or the record           |
| `codebase-design`               | a module's interface, a seam, or code that is hard to test                  |
| `research`                      | a question needs primary sources; the notes go to `docs/research/<slug>.md` |
| `to-spec`                       | a conversation turns into a spec on the issue tracker                       |
| `to-tickets`                    | a spec or plan splits into tickets with their blocking edges                |
| `implement`                     | building from a spec or tickets                                             |
| `tdd`                           | a feature or bug fix goes test-first                                        |
| `code-review`                   | a branch or PR needs a review against the repo's standards and its spec     |
| `diagnosing-bugs`               | something is broken, throwing or slow and the cause is unknown              |
| `handoff`                       | a session ends and another agent picks the work up                          |
| `implement-spec`                | building a whole spec from the issue tracker, ticket by ticket              |
| `improve-codebase-architecture` | looking for deepening opportunities across the codebase                     |
| `retro`                         | a finished piece of work needs its lessons written down                     |
| `triage`                        | incoming issues need a label and a next state                               |
| `wayfinder`                     | a goal is big and the route to it is unclear                                |
| `writing-for-agents`            | creating or editing a skill, `AGENTS.md` or `CLAUDE.md`                     |
| `wizard`                        | a step only a human can do: credentials, dashboards, a one-off cutover      |
| `setup-matt-pocock-skills`      | switching the issue tracker or the domain-doc layout below                  |

### Issue tracker

GitHub issues in this repo, through `gh`; no triage labels. See `docs/agents/issue-tracker.md`.

### Domain docs

Single context: `GLOSSARY.md` at the root, decision records in `docs/decisions/`. A skill's "ADR" or
`docs/adr/` means a decision record there. See `docs/agents/domain.md`.

<important if="you are running a check, a test, a sync or the setup">

## Commands

```bash
pnpm check                      # dw-sdlc gate: vp check, the references table, vp test, the Checks; = CI
pnpm check:fix                  # vp check --fix — formats and applies lint fixes
pnpm test                       # vp test: scripts/ and the vendored lint rules
pnpm agents:check               # this file's links, the paths it names, the skills
pnpm references:sync [dir...]   # clone or update each Reference .ai/references.json declares, on this machine
pnpm references:setup           # write the references/AGENTS.md table from .ai/references.json
pnpm bootstrap [--dry-run]      # set a machine or fresh clone up: tools, hooks, the sdlc plugin, references
```

</important>

## Task Router

Match this table **before** researching or coding — read every row that matches, explore only the rest.

| task                                                                                 | read                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| changing, running or checking the mod; Herdr's API                                   | `docs/agents/mod.md`, `RECIPE.md`             |
| lint, format, type-check, tests, hooks, worktrees, CI, adding a dependency, the gate | `docs/agents/tooling.md`                      |
| which code a path belongs to, and the docs to read before changing it                | `.ai/primitives.json`                         |
| a decision record: writing, numbering or citing one; a domain term                   | `docs/agents/domain.md`, `GLOSSARY.md`        |
| why the tooling is shaped this way                                                   | `docs/decisions/`, by each record's `touches` |
| an issue, a spec or tickets                                                          | `docs/agents/issue-tracker.md`                |
| how a dependency behaves (API, idiom, error); adding or updating a reference         | `references/AGENTS.md`, then its source there |
| opening a pull request or writing its body                                           | `.github/PULL_REQUEST_TEMPLATE.md`            |
| a new project from the template, or pulling the template's changes into a copy       | `README.md`, `docs/agents/tooling.md`         |
| reviewing a change, or how code is written here                                      | `CODING_STANDARDS.md`                         |
