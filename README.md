# herdr-keep-awake

A Herdr mod: a switch in the tab bar that keeps your Mac and its display awake while your coding agents work.

Vite+ formats, lints, type-checks and tests; pnpm resolves nothing younger than 7 days; the dw-sdlc
guardrails, Matt Pocock's engineering skills and a set of reference repos come ready for Claude Code.
Agents start at `AGENTS.md`.

## Requirements

- Node 24.11 or later, and pnpm, which switches itself to the version `packageManager` pins.
- [Claude Code](https://code.claude.com), `gh` signed in (`gh auth login`, then `gh auth setup-git`
  for private clones), git 2.32 or later, and `jq`, which the sdlc plugin's guards need.
- [uv](https://docs.astral.sh/uv/), whose `uvx` runs copier to start a project or pull the template's
  changes.

## Setup

```bash
pnpm install
pnpm bootstrap
```

`pnpm bootstrap` checks the tools above, adds the `dw-sdlc` marketplace and installs its sdlc plugin
at user scope when either is missing, runs the plugin's setup for this repo and its doctor, and clones
the references. A second run changes nothing; `--dry-run` only reads.

## Commands

| command                         | what it does                                                       |
| ------------------------------- | ------------------------------------------------------------------ |
| `pnpm check`                    | the Gate: `vp check`, `vp test`, then the Checks; = CI             |
| `pnpm check:fix`                | formats and applies lint fixes                                     |
| `pnpm test`                     | runs the tests beside the code, `scripts/**/*.test.ts`             |
| `pnpm agents:check`             | holds `AGENTS.md` to its links, paths and skills                   |
| `pnpm references:sync [dir...]` | clones or updates the References `.ai/references.json` declares    |
| `pnpm references:setup`         | writes the `references/AGENTS.md` table from `.ai/references.json` |
| `pnpm bootstrap [--dry-run]`    | sets up a machine or a fresh clone                                 |

## A new project

```bash
uvx copier@9.19.1 copy --trust gh:dominikwozniak/package-template-pnpm <dir>
```

Copier asks for the name, one sentence on what the project is for, and whether to create its GitHub
repository. It then puts both in `package.json`, `AGENTS.md`, `README.md` and `GLOSSARY.md`, runs
`git init` and `pnpm bootstrap`, commits, and creates the private repository with squash merges only
and branches deleted on merge. `--trust` lets it run those steps, the tasks in the template's
`copier.yml`.

Then add the repositories the project reads with `/sdlc-references-add <repository>`, from the sdlc
plugin. The template's decision records and terms stay; the project's own are numbered on from them.

## The template's changes

A copy records the template commit it was made from in `.copier-answers.yml`, which only copier
writes. To pull what the template changed since, run on a branch with a clean tree:

```bash
uvx copier@9.19.1 update --trust
```

Copier replays the template's changes onto the copy and leaves conflict markers where the copy changed
the same lines. Resolve them, run `pnpm check`, and open a pull request.
