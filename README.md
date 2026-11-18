# herdr-keep-awake

A Herdr mod: a switch in the tab bar that keeps your Mac and its display awake while your coding agents work.

![Keep awake](preview.png)

## What it does

- **On:** the mod runs `caffeinate -d -i -s` as a hidden Herdr terminal. The display does not sleep,
  and the Mac does not go to sleep on its own.
- **Off:** it ends that `caffeinate`.
- The switch is remembered across restarts. When Herdr quits, the mod ends `caffeinate`. If Herdr
  crashes, `caffeinate -w <Herdr's pid>` ends by itself.
- `cmd-alt-k` flips it from the keyboard.

macOS only: it needs `caffeinate`. Closing the lid still puts a Mac to sleep, unless it runs in
clamshell mode on power with an external display.

## Install

Ask the agent in Herdr:

> Add the mod from github.com/dominikwozniak/herdr-keep-awake and put its switch at the right end of
> my tab bar.

Or by hand:

1. Copy `mods/keep-awake/` to `~/.config/herdr-app/mods/keep-awake/`.
2. Add its block to your layout in `~/.config/herdr-app/layouts/`, in the row of your tab bar. If the
   tab bar is a single `tabs` block, wrap it in a `row` with this block after it:

   ```json
   {
     "id": "keep-awake",
     "type": "block",
     "content": { "mod": "keep-awake" },
     "size": { "px": 96 },
     "window_drag": true
   }
   ```

3. Merge `keys.json` into `~/.config/herdr-app/keys.json`, unless `cmd-alt-k` is already yours.
4. Run `herdr-app check ~/.config/herdr-app/mods/keep-awake`.

The mod runs programs: `hc` to start and end `caffeinate`, and `sh` once, to read Herdr's pid. It
reaches no network and reads no files.

## Development

Node 24.11 or later and pnpm. Agents start at `AGENTS.md`.

```bash
pnpm install
pnpm bootstrap
```

| command                         | what it does                                                    |
| ------------------------------- | --------------------------------------------------------------- |
| `pnpm mod:install`              | copies `mods/keep-awake/` into Herdr, which reloads it          |
| `pnpm check`                    | the Gate: `vp check`, `vp test`, then the Checks; = CI          |
| `pnpm check:fix`                | formats and applies lint fixes                                  |
| `pnpm test`                     | runs the tests in `tests/` and `scripts/`                       |
| `pnpm agents:check`             | holds `AGENTS.md` to its links, paths and skills                |
| `pnpm references:sync [dir...]` | clones or updates the References `.ai/references.json` declares |
| `pnpm bootstrap [--dry-run]`    | sets up a machine or a fresh clone                              |

The tooling comes from a copier template; `.copier-answers.yml` records which commit.

## License

MIT
