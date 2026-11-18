# herdr-keep-awake — agent rules

> `CLAUDE.md` is a symlink to this file — edit `AGENTS.md`.

A Herdr mod: a switch in the tab bar that keeps your Mac and its display awake while your coding
agents work. `RECIPE.md` describes what it does and how it is built; read it before a change.

## Layout

- `mods/keep-awake/` — the mod, the folder people install. Plain JavaScript that Herdr loads:
  `mods/keep-awake/main.js` is the switch, `mods/keep-awake/awake.js` what it runs and how it reads
  hc, with no imports so Node can test it. Nothing else goes in this folder.
- `tests/` — `node:test` tests of `awake.js`; Node cannot load `main.js`, which imports Herdr's
  modules.
- `RECIPE.md` — the brief another agent builds the mod from; `keys.json` — the key it expects;
  `preview.png` — the gallery's picture. The repo topic `herdr-mod` lists it on herdr.dev/mods.

## Commands

```bash
pnpm test           # node --test on tests/; CI also runs node --check on each mod file
pnpm mod:install    # copy mods/keep-awake/ into Herdr's home; Herdr reloads the mod
```

## Herdr

- Herdr's own guide is the API reference: `~/.config/herdr-app/AGENTS.md`, with `herdr.d.ts` and
  `gpui-kit.d.ts` beside it, written by Herdr for the installed version.
- After every change: `pnpm mod:install`, `herdr-app check ~/.config/herdr-app/mods/keep-awake`,
  `herdr-app status` (`errors: []`), then `herdr-app shot <file>.png` and look at the switch.
- `herdr-app do keep-awake.toggle` flips the switch from a shell; `pgrep -fl "caffeinate -d"` and
  `pmset -g assertions` show the hold.
- Install by copy, never by a link: Herdr writes `gpui-kit.d.ts` and a `jsconfig.json` into every mod
  folder it loads, and a save behind a link does not reload the mod.

## What tripped the build

- `exec` waits for its program and stops it after 30 s, so the hold runs as an hc terminal
  (`hc run --bg`) and ends with `hc kill`.
- `pgrep -x Herdr` run through `exec` finds nothing; `sh -c 'echo $PPID'` gives the app's pid.
- `terminals()` updates a moment after `hc run` or `hc kill` returns, and two copies of the mod race
  on the same name: a failed run or kill asks `hc ls --json` before it reports an error.
- `close()` gets 250 ms when the app quits; `caffeinate -w <pid>` covers a crash.
- The block sits in a `window_drag` row, so the switch stops `mouse_down` from reaching it.

## Git

- Conventional Commits (`feat: …`, `fix: …`) with a `Co-Authored-By` trailer on agent commits.
- Changes reach `main` through a pull request, squash-merged once CI is green.
