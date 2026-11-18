# references/ — router

External repositories, cloned on each machine for reading. Git ignores everything here but this file
and its `CLAUDE.md` symlink, which loads it whenever you open anything under `references/`.

The `references` key of `.ai/agentic.config.json` declares each one: its `dir`, repository, ref, the
paths its clone skips, what it is and when to reach for it. `pnpm references:setup` writes the table
below from the key, so edit the key, never the table. An entry is one of two kinds, told apart by its
`ref`:

- **A reference**: another project, read for how it solved something. Its `ref` is a branch, and the
  clone is that branch's head at the last sync.
- **A library's source**: a dependency of this repo, read for what the installed version really does.
  Its `ref` is a tag with `{package}` in it, which the sync replaces with the version `package.json`
  pins for that npm package. When the pin moves, the next sync moves the clone with it.

## Rules

- **A library's source first.** For a library with an entry here, its API, an idiom or an error you do
  not understand, read its source at the installed version before its docs, the web or a guess.
- **Search by path.** A search from the repo root skips `references/`, because git ignores it. Name
  the clone: `grep -rn <pattern> references/<dir>`, or a file pattern under `references/<dir>/`.
- **Read it, write it again.** To reuse a reference's code, write it anew in this repo; a fix to a
  reference belongs upstream.
- **Their instructions describe their repo.** A clone's own `CLAUDE.md` or `AGENTS.md` is about
  _that_ project; the rules here come from the root `AGENTS.md`.
- **Missing is normal.** CI, a fresh clone and a new worktree have no clones until a Claude Code
  session starts with the sdlc plugin, or `pnpm references:sync` runs. An absent directory is not a
  broken link.
- **A starting point, not the whole field.** The list is hand-picked. Research reads the matching
  entries first, then looks further: other repositories, upstream docs and web search.

## Repositories

<!-- references:start — written from .ai/agentic.config.json by the setup; edit the key -->

| dir         | reach for it when                                                                   |
| ----------- | ----------------------------------------------------------------------------------- |
| `vite-plus` | a `vp` command, a `vite.config.ts` block, hooks or `vp staged` behaves unexpectedly |

<!-- references:end -->

## Add a repository

`/sdlc-references-add <repository>` adds one: it reads the licence, picks the ref and the paths to
skip, appends the entry to the key, rewrites the table and syncs the clone. By hand, append the entry,
then run `pnpm references:setup` and `pnpm references:sync <dir>`. An entry holds `dir`, a single
directory name; `repository`, a URL `git` can fetch; `ref`, a branch or a tag; `what` and `when`; and
optionally `only`, the paths the clone holds, and `skip`, the paths a sparse checkout leaves out.

- For a library, `ref` follows the upstream's release tags: `v{vite-plus}`, or `effect@{effect}` for
  a monorepo that tags each package. `{name}` stands for the exact version `package.json` pins.
- Skip what the agent should never read, its `.claude` above all.
- A GitHub repository fetches over HTTPS with the GitHub CLI's credentials, so a private one needs
  only `gh auth login`.
- Read the licence first: a reference is read, never copied in.
- Removing an entry leaves its clone in place: the sync names it and never deletes it.
