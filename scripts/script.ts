// What every script shares: `Refusal`, the error that ends a run before what it was asked to do, the
// entry point that prints it and exits 1, the repository root, an error's message, and the environment a
// git child runs in.

import { execFileSync } from "node:child_process"
import { join } from "node:path"

export const repoRoot = join(import.meta.dirname, "..")

/** Why the run ends before what it was asked to do; the entry point prints it and exits 1. */
export class Refusal extends Error {}

/**
 * Runs `main` as the script `name` and gives the exit code for `process.exitCode`: a `Refusal` is
 * printed as the script's line and is 1; any other error is a bug, and is thrown with its stack.
 */
export async function runScript(name: string, main: () => Promise<void>): Promise<0 | 1> {
  try {
    await main()
    return 0
  } catch (error) {
    if (!(error instanceof Refusal)) {
      throw error
    }
    console.error(`${name} — ${error.message}`)
    return 1
  }
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The environment minus `git rev-parse --local-env-vars`, so a git child finds its repository from `cwd`:
 * a `git init` under a hook's `GIT_DIR` of a linked worktree sets `core.bare` in the main checkout.
 */
export function gitEnv(): NodeJS.ProcessEnv {
  const local = new Set(execFileSync("git", ["rev-parse", "--local-env-vars"], { encoding: "utf8" }).split("\n"))
  return Object.fromEntries(Object.entries(process.env).filter(([key]) => !local.has(key)))
}
