// Sets this machine and this clone up for the repo: the tools the hooks and scripts need, the
// dependencies and git hooks, the sdlc plugin from dw-sdlc at user scope with its per-repo setup and its
// doctor, and the reference clones. Safe to repeat: a step whose state is already right changes nothing.

import { spawnSync } from "node:child_process"
import { join } from "node:path"
import { parseArgs } from "node:util"

import { messageOf, Refusal, repoRoot, runScript } from "./script.ts"

const MARKETPLACE = "dw-sdlc"
const MARKETPLACE_SOURCE = "dominikwozniak/dw-sdlc"
const PLUGIN = "sdlc@dw-sdlc"
const HOOKS_PATH = ".vite-hooks/_"

const USAGE = `Usage: pnpm bootstrap [--dry-run]

Checks node, git, gh, claude and jq; runs pnpm install; adds the ${MARKETPLACE} marketplace and
installs ${PLUGIN} at user scope when missing; runs its setup for this repo and its doctor; syncs
references/. --dry-run only reads, and prints what a run would change.`

export type Result = { ok: boolean; out: string; err: string }

/** What a run touches outside its own code: a command in the repo root, and the lines it prints. */
export type Tools = {
  run(command: string, args: string[]): Result
  log(line: string): void
}

type Version = [number, number, number]

/** One line of the report: what happened, padded so the subjects line up, then to what. */
function say(tools: Tools, verb: string, subject: string): void {
  tools.log(`${verb.padEnd(9)} ${subject}`)
}

function versionIn(text: string): Version | undefined {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(text)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined
}

function atLeast(version: Version, minimum: Version): boolean {
  for (const [index, part] of version.entries()) {
    const floor = minimum[index] ?? 0
    if (part !== floor) {
      return part > floor
    }
  }
  return true
}

/** The lines that say which required tool is missing or too old, each with its fix. */
function missingTools(tools: Tools): string[] {
  const required: { command: string; minimum?: Version; fix: string }[] = [
    { command: "node", minimum: [24, 11, 0], fix: "install Node 24.11 or later" },
    { command: "git", minimum: [2, 32, 0], fix: "install git 2.32 or later" },
    { command: "claude", fix: "install Claude Code: https://code.claude.com" },
    { command: "jq", fix: "brew install jq — without it every sdlc guard lets everything through" }
  ]
  const problems: string[] = []
  for (const { command, minimum, fix } of required) {
    const result = tools.run(command, ["--version"])
    const version = versionIn(result.out)
    if (!result.ok) {
      problems.push(`${command} not found: ${fix}`)
    } else if (minimum && (version === undefined || !atLeast(version, minimum))) {
      problems.push(`${command} ${result.out.trim()} is too old: ${fix}`)
    }
  }
  return problems
}

/** The objects of a JSON array a command printed; anything else in it is skipped. */
function entries(result: Result, what: string): Record<string, unknown>[] {
  if (!result.ok) {
    throw new Refusal(`${what} failed: ${result.err.trim()}`)
  }
  let value: unknown
  try {
    value = JSON.parse(result.out)
  } catch (error) {
    throw new Refusal(`${what} printed no JSON: ${messageOf(error)}`)
  }
  if (!Array.isArray(value)) {
    throw new Refusal(`${what} printed no JSON array`)
  }
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
}

type Plugin = { enabled: boolean; installPath: string | undefined }

function installedPlugin(tools: Tools): Plugin | undefined {
  const plugin = entries(tools.run("claude", ["plugin", "list", "--json"]), "claude plugin list").find(
    (entry) => entry.id === PLUGIN && entry.scope === "user"
  )
  if (plugin === undefined) {
    return undefined
  }
  return {
    enabled: plugin.enabled === true,
    installPath: typeof plugin.installPath === "string" ? plugin.installPath : undefined
  }
}

/** Runs a step that changes state, or says it would; throws with `fix` when it fails. */
function change(tools: Tools, dryRun: boolean, label: string, command: string, args: string[], fix = ""): void {
  if (dryRun) {
    say(tools, "would", label)
    return
  }
  const result = tools.run(command, args)
  if (!result.ok) {
    throw new Refusal(`${label} failed: ${result.err.trim()}${fix}`)
  }
  say(tools, "done", label)
}

export function bootstrap(tools: Tools, dryRun: boolean): void {
  const problems = missingTools(tools)
  if (problems.length > 0) {
    throw new Refusal(`missing tools:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`)
  }
  if (!tools.run("gh", ["auth", "status"]).ok) {
    say(tools, "warning", "gh is not signed in: run `gh auth login` and `gh auth setup-git` for private clones")
  }

  change(tools, dryRun, "pnpm install", "pnpm", ["install"])

  let installed = false
  const marketplaces = entries(tools.run("claude", ["plugin", "marketplace", "list", "--json"]), "marketplace list")
  if (marketplaces.some((entry) => entry.name === MARKETPLACE)) {
    say(tools, "ok", `marketplace ${MARKETPLACE}`)
  } else {
    const args = ["plugin", "marketplace", "add", MARKETPLACE_SOURCE, "--sparse", ".claude-plugin", "plugins"]
    const fix = "\nThe repository is private: run `gh auth setup-git` so git can clone it, then run again."
    change(tools, dryRun, `add marketplace ${MARKETPLACE}`, "claude", args, fix)
    installed = true
  }

  let plugin = installedPlugin(tools)
  if (plugin === undefined) {
    change(tools, dryRun, `install ${PLUGIN}`, "claude", ["plugin", "install", PLUGIN, "--scope", "user"])
    installed = true
    plugin = dryRun ? undefined : installedPlugin(tools)
  } else if (!plugin.enabled) {
    change(tools, dryRun, `enable ${PLUGIN}`, "claude", ["plugin", "enable", PLUGIN, "--scope", "user"])
    installed = true
  } else {
    say(tools, "ok", PLUGIN)
  }

  // The setup has its own dry run and the doctor only reads, so both run either way once the plugin is
  // on disk. A failed doctor check is reported, not refused: the rest of the setup still holds.
  if (plugin?.installPath === undefined) {
    say(tools, "would", `run the setup and the doctor once ${PLUGIN} is installed`)
  } else {
    const cli = join(plugin.installPath, "dw-sdlc", "src", "cli.ts")
    const setup = tools.run("node", [cli, "setup", ...(dryRun ? ["--dry-run"] : [])])
    if (!setup.ok) {
      throw new Refusal(`setup failed: ${setup.err.trim() || setup.out.trim()}`)
    }
    for (const line of setup.out.trim().split("\n").filter(Boolean)) {
      say(tools, "setup", line)
    }
    const doctor = tools.run("node", [cli, "doctor"])
    for (const line of doctor.out.trim().split("\n").filter(Boolean)) {
      say(tools, "doctor", line)
    }
    if (!doctor.ok) {
      say(tools, "warning", "the doctor names a FAIL above: fix it before relying on the guards")
    }
  }

  if (dryRun) {
    say(tools, "would", "pnpm references:sync")
  } else {
    const sync = tools.run("pnpm", ["references:sync"])
    if (sync.ok) {
      say(tools, "done", "pnpm references:sync")
    } else {
      say(tools, "warning", "references:sync failed (offline?): run it again later")
    }
  }

  const hooksPath = tools.run("git", ["config", "core.hooksPath"]).out.trim()
  if (hooksPath === HOOKS_PATH) {
    say(tools, "ok", `git hooks at ${HOOKS_PATH}`)
  } else if (!dryRun) {
    say(tools, "warning", `core.hooksPath is "${hooksPath}", not ${HOOKS_PATH}: run \`pnpm exec vp hooks status\``)
  }

  if (installed) {
    say(tools, dryRun ? "would" : "next", `restart Claude Code so it loads ${PLUGIN}`)
  }
}

const machine: Tools = {
  run(command, args) {
    const result = spawnSync(command, args, { cwd: repoRoot, encoding: "utf8" })
    return { ok: result.status === 0, out: result.stdout ?? "", err: result.stderr || result.error?.message || "" }
  },
  log(line) {
    console.log(line)
  }
}

async function main(argv: string[]): Promise<void> {
  let values: { "dry-run"?: boolean; help?: boolean }
  try {
    values = parseArgs({
      args: argv,
      options: { "dry-run": { type: "boolean" }, help: { type: "boolean", short: "h" } }
    }).values
  } catch (error) {
    throw new Refusal(`${messageOf(error)}\n\n${USAGE}`)
  }
  if (values.help === true) {
    console.log(USAGE)
    return
  }
  bootstrap(machine, values["dry-run"] === true)
}

if (import.meta.main) {
  process.exitCode = await runScript("bootstrap", () => main(process.argv.slice(2)))
}
