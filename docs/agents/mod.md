# The mod

How `mods/keep-awake/` works with Herdr, and what `RECIPE.md` does not say.

## Herdr's API

- Herdr's own guide is the source: `~/.config/herdr-app/AGENTS.md`, with `herdr.d.ts` and
  `gpui-kit.d.ts` beside it. Herdr writes them on start, for the installed version; they are not in
  this repo.
- Herdr loads `mods/keep-awake/main.js` as plain JavaScript and resolves `gpui-kit`, `gpui-base` and
  `herdr` itself. Node cannot import `main.js`, so what a test needs lives in `awake.js`, which
  imports nothing.
- Everything in `mods/keep-awake/` ships to the people who install the mod. Tests stay in `tests/`.

## Running it

- `pnpm mod:install` copies `mods/keep-awake/` into Herdr's home (`$HERDR_APP_HOME`, else
  `~/.config/herdr-app`). Herdr reloads the mod on that save; a running hold survives the reload.
- Never link the folder instead. Herdr writes `gpui-kit.d.ts` and a `jsconfig.json` with
  `strictNullChecks` off into every mod folder it loads, and through a link they land here: the
  type-aware lint then reads that `jsconfig.json`, and a save here no longer reloads the mod.
- After every change: `herdr-app check ~/.config/herdr-app/mods/keep-awake`, then `herdr-app status`
  (`errors: []`) and `herdr-app shot <file>.png` to look at the switch.
- `herdr-app do keep-awake.toggle` flips the switch from a shell. `pgrep -fl "caffeinate -d"` and
  `pmset -g assertions` show the hold.

## What tripped the build

- `exec` waits for its program and stops it after 30 s, so the hold runs as an hc terminal
  (`hc run --bg`) and ends with `hc kill`.
- `pgrep -x Herdr` run through `exec` finds nothing. `sh -c 'echo $PPID'` gives the app's pid,
  because `exec`'s programs are the app's children.
- `terminals()` updates a moment after `hc run` or `hc kill` returns. Two copies of the mod (two
  screens) can both try: a failed run or kill asks `hc ls --json` before it reports an error.
- `hc ls --json` prints `{ "hidden_finished": …, "terminals": [ … ] }`; a named terminal carries
  `name`.
- `close()` gets 250 ms when the app quits. `exec("hc", ["kill", …])` goes out in time;
  `caffeinate -w <pid>` covers a crash.
- The block sits in a `window_drag` row, so the switch stops `mouse_down` from reaching it.
