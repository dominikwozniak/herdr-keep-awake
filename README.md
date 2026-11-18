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

Closing the lid still puts a Mac to sleep, unless it runs in clamshell mode on power with an
external display.

## Requirements

- **macOS**, for `caffeinate`. It ships with macOS at `/usr/bin/caffeinate`, so there is nothing to
  install; `which caffeinate` confirms it. Linux and Windows have no `caffeinate`, and the switch
  turns red there with an error toast.
- **The Herdr desktop app**, whose `hc` (herdr-core) starts and ends `caffeinate`.

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

Node 22 or later; no dependencies to install. Agents start at `AGENTS.md`.

| command            | what it does                                           |
| ------------------ | ------------------------------------------------------ |
| `pnpm test`        | tests `awake.js` with `node:test`                      |
| `pnpm mod:install` | copies `mods/keep-awake/` into Herdr, which reloads it |

## License

MIT
