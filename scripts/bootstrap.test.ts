// What bootstrap does on a fake machine whose commands answer from a table: a ready machine changes
// nothing, a dry run only reads, a missing plugin is installed and set up, and a missing tool refuses.

import assert from "node:assert/strict"

import { describe, it } from "vite-plus/test"

import { bootstrap, type Result, type Tools } from "./bootstrap.ts"
import { Refusal } from "./script.ts"

const INSTALL_PATH = "/home/me/.claude/plugins/cache/dw-sdlc/sdlc/0.15.0"
const CLI = `${INSTALL_PATH}/dw-sdlc/src/cli.ts`

const ok = (out = ""): Result => ({ ok: true, out, err: "" })
const failed = (err: string): Result => ({ ok: false, out: "", err })

const plugin = (enabled = true) =>
  ok(JSON.stringify([{ id: "sdlc@dw-sdlc", scope: "user", enabled, installPath: INSTALL_PATH }]))

/** The answers of a machine with every tool and the plugin in place. */
function ready(): Map<string, Result | Result[]> {
  return new Map<string, Result | Result[]>([
    ["node --version", ok("v24.19.0\n")],
    ["git --version", ok("git version 2.55.0\n")],
    ["claude --version", ok("2.1.302 (Claude Code)\n")],
    ["jq --version", ok("jq-1.8.2\n")],
    ["gh auth status", ok()],
    ["pnpm install", ok()],
    ["claude plugin marketplace list --json", ok(JSON.stringify([{ name: "dw-sdlc" }]))],
    ["claude plugin list --json", plugin()],
    [`node ${CLI} setup`, ok("unchanged   .git/info/exclude\n")],
    [`node ${CLI} setup --dry-run`, ok("unchanged   .git/info/exclude\n")],
    [`node ${CLI} doctor`, ok("PASS  jq                jq-1.8.2\n")],
    ["pnpm references:sync", ok("references/vite-plus  401ada6\n")],
    ["git config core.hooksPath", ok(".vite-hooks/_\n")]
  ])
}

/** A fake machine: each command answers from `answers` (a list answers in turn), and every call is kept. */
function machine(answers: Map<string, Result | Result[]>): Tools & { calls: string[]; lines: string[] } {
  const calls: string[] = []
  const lines: string[] = []
  return {
    calls,
    lines,
    run(command, args) {
      const call = [command, ...args].join(" ")
      calls.push(call)
      const answer = answers.get(call)
      if (Array.isArray(answer)) {
        return answer.length > 1 ? (answer.shift() ?? failed("no answer")) : (answer[0] ?? failed("no answer"))
      }
      return answer ?? failed(`${command}: command not found`)
    },
    log(line) {
      lines.push(line)
    }
  }
}

const WRITES = /^(pnpm install|claude plugin (marketplace add|install|enable)|pnpm references:sync)/

describe("bootstrap", () => {
  it("changes nothing on a ready machine beyond the idempotent install, setup and sync", () => {
    const tools = machine(ready())
    bootstrap(tools, false)
    assert.deepEqual(
      tools.calls.filter((call) => /^claude plugin (marketplace add|install|enable)/.test(call)),
      []
    )
    assert.ok(tools.calls.includes(`node ${CLI} setup`))
    assert.ok(tools.lines.includes("ok        sdlc@dw-sdlc"))
    assert.ok(!tools.lines.some((line) => line.includes("restart Claude Code")))
  })

  it("only reads on a dry run, and runs the setup's own dry run", () => {
    const tools = machine(ready())
    bootstrap(tools, true)
    assert.deepEqual(
      tools.calls.filter((call) => WRITES.test(call)),
      []
    )
    assert.ok(tools.calls.includes(`node ${CLI} setup --dry-run`))
    assert.ok(tools.lines.includes("would     pnpm install"))
  })

  it("adds the marketplace and installs the plugin when both are missing, then sets it up", () => {
    const answers = ready()
    answers.set("claude plugin marketplace list --json", ok("[]"))
    answers.set("claude plugin marketplace add dominikwozniak/dw-sdlc --sparse .claude-plugin plugins", ok())
    answers.set("claude plugin list --json", [ok("[]"), plugin()])
    answers.set("claude plugin install sdlc@dw-sdlc --scope user", ok())
    const tools = machine(answers)
    bootstrap(tools, false)
    assert.ok(tools.lines.includes("done      add marketplace dw-sdlc"))
    assert.ok(tools.lines.includes("done      install sdlc@dw-sdlc"))
    assert.ok(tools.calls.includes(`node ${CLI} setup`))
    assert.ok(tools.lines.includes("next      restart Claude Code so it loads sdlc@dw-sdlc"))
  })

  it("enables a plugin that is installed but off", () => {
    const answers = ready()
    answers.set("claude plugin list --json", plugin(false))
    answers.set("claude plugin enable sdlc@dw-sdlc --scope user", ok())
    const tools = machine(answers)
    bootstrap(tools, false)
    assert.ok(tools.lines.includes("done      enable sdlc@dw-sdlc"))
  })

  it("refuses with every missing or old tool named, before it changes anything", () => {
    const answers = ready()
    answers.set("node --version", ok("v24.10.0\n"))
    answers.delete("jq --version")
    const tools = machine(answers)
    assert.throws(
      () => bootstrap(tools, false),
      (error: unknown) => {
        assert.ok(error instanceof Refusal)
        assert.match(error.message, /node v24\.10\.0 is too old/)
        assert.match(error.message, /jq not found/)
        return true
      }
    )
    assert.deepEqual(
      tools.calls.filter((call) => WRITES.test(call)),
      []
    )
  })

  it("points at gh auth setup-git when the private marketplace does not clone", () => {
    const answers = ready()
    answers.set("claude plugin marketplace list --json", ok("[]"))
    const tools = machine(answers)
    assert.throws(() => bootstrap(tools, false), /gh auth setup-git/)
  })

  it("warns, and goes on, when the references do not sync", () => {
    const answers = ready()
    answers.set("pnpm references:sync", failed("could not resolve host"))
    const tools = machine(answers)
    bootstrap(tools, false)
    assert.ok(tools.lines.some((line) => line.startsWith("warning   references:sync failed")))
    assert.ok(tools.lines.includes("ok        git hooks at .vite-hooks/_"))
  })

  it("reports the doctor's lines, and warns and goes on when one of its checks fails", () => {
    const answers = ready()
    answers.set(`node ${CLI} doctor`, { ok: false, out: "PASS  jq  jq-1.8.2\nFAIL  plugin  not enabled\n", err: "" })
    const tools = machine(answers)
    bootstrap(tools, false)
    assert.ok(tools.lines.includes("doctor    PASS  jq  jq-1.8.2"))
    assert.ok(tools.lines.includes("doctor    FAIL  plugin  not enabled"))
    assert.ok(tools.lines.some((line) => line.startsWith("warning   the doctor names a FAIL")))
    assert.ok(tools.lines.includes("done      pnpm references:sync"))
  })
})
