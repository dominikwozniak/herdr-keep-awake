// What agents-check finds in a repo laid out in a temporary directory: nothing when it holds its shape,
// and each broken promise by name. The repo itself is checked last, so `pnpm test` fails with it.

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { afterAll, describe, it } from "vite-plus/test"

import { checkRepo } from "./agents-check.ts"
import { gitEnv, repoRoot } from "./script.ts"

const made: string[] = []
afterAll(() => {
  for (const dir of made) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const AGENTS = (extra = "") =>
  [
    "# example — agent rules",
    "",
    "## Project map",
    "",
    "- `scripts/` — the code; `scripts/script.ts` is shared, its tests are `*.test.ts`",
    "",
    "## Agent skills",
    "",
    "| skill | reach for it when |",
    "| --- | --- |",
    "| `tdd` | test-first |",
    "",
    "### Issue tracker",
    "",
    "See `docs/agents/issue-tracker.md`.",
    "",
    "## Task Router",
    "",
    "| task | read |",
    "| --- | --- |",
    "| a dependency | `docs/agents/tooling.md` |",
    extra,
    ""
  ].join("\n")

const RECORD = [
  "---",
  "rule: A rule.",
  "---",
  "",
  "# 0001 — A rule",
  "",
  "## Context",
  "## Decision",
  "## Trade-off",
  "## Revisit when",
  ""
].join("\n")

/** A repo that holds every promise, with `change` applied to it before the check. */
function fixture(change: (root: string) => void = () => {}): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "agents-check-")))
  made.push(root)
  write(join(root, "AGENTS.md"), AGENTS())
  symlinkSync("AGENTS.md", join(root, "CLAUDE.md"))
  write(join(root, "references", "AGENTS.md"), "# references\n")
  symlinkSync("AGENTS.md", join(root, "references", "CLAUDE.md"))
  write(join(root, "scripts", "script.ts"), "")
  write(join(root, "docs", "agents", "tooling.md"), "")
  write(join(root, ".agents", "skills", "tdd", "SKILL.md"), "")
  write(join(root, "scripts", "script.test.ts"), "")
  write(join(root, "skills-lock.json"), JSON.stringify({ version: 1, skills: { tdd: {} } }))
  write(
    join(root, "vite.config.ts"),
    [
      'const ignored = [".agents/skills/", "*.local.json"]',
      'export default { test: { include: ["scripts/**/*.test.ts"] } }'
    ].join("\n")
  )
  write(join(root, "tsconfig.json"), JSON.stringify({ include: ["scripts", "vite.config.ts"] }))
  write(join(root, "package.json"), JSON.stringify({ devDependencies: { "dw-sdlc": "0.22.0" } }))
  write(join(root, "pnpm-workspace.yaml"), "minimumReleaseAge: 10080\nminimumReleaseAgeStrict: true\nsaveExact: true\n")
  write(join(root, "docs", "decisions", "0001-a-rule.md"), RECORD)
  execFileSync("git", ["init", "--quiet"], { cwd: root, env: gitEnv() })
  change(root)
  return root
}

const messages = (root: string) =>
  checkRepo(root).map(({ file, message, remedy }) => {
    assert.notEqual(remedy, "", `${file}: ${message} has no remedy`)
    return `${file}: ${message}`
  })

describe("checkAgents", () => {
  it("finds nothing when the repo holds its shape", () => {
    assert.deepEqual(messages(fixture()), [])
  })

  it("names a references/CLAUDE.md that is a plain file, a link elsewhere, or missing", () => {
    const root = fixture((dir) => {
      rmSync(join(dir, "references", "CLAUDE.md"))
      write(join(dir, "references", "CLAUDE.md"), "copy\n")
    })
    assert.deepEqual(messages(root), ["references/CLAUDE.md: is a file, not a symlink to AGENTS.md"])
    rmSync(join(root, "references", "CLAUDE.md"))
    symlinkSync("README.md", join(root, "references", "CLAUDE.md"))
    assert.deepEqual(messages(root), ["references/CLAUDE.md: points at README.md, not AGENTS.md"])
    rmSync(join(root, "references", "CLAUDE.md"))
    assert.deepEqual(messages(root), ["references/CLAUDE.md: missing; it should be a symlink to AGENTS.md"])
  })

  it("names a path the Project map or the Task Router sends to that does not exist", () => {
    const root = fixture((dir) => {
      rmSync(join(dir, "scripts", "script.ts"))
      rmSync(join(dir, "docs", "agents", "tooling.md"))
    })
    assert.deepEqual(messages(root), [
      "AGENTS.md: names scripts/script.ts, which does not exist",
      "AGENTS.md: names docs/agents/tooling.md, which does not exist"
    ])
  })

  it("names a skill vendored in one place but named in the other", () => {
    const root = fixture((dir) => {
      write(join(dir, ".agents", "skills", "grilling", "SKILL.md"), "")
      write(
        join(dir, "AGENTS.md"),
        AGENTS().replace("| `tdd` | test-first |", "| `tdd` | test-first |\n| `implement` | build |")
      )
    })
    assert.deepEqual(messages(root), [
      "AGENTS.md: skill grilling is in .agents/skills/ but Agent skills does not name it",
      "AGENTS.md: Agent skills names implement, which .agents/skills/ does not hold"
    ])
  })
})

describe("the toolchain", () => {
  it("names a tool config, docs/adr/ and a tool Vite+ replaces", () => {
    const root = fixture((dir) => {
      write(join(dir, ".oxlintrc.json"), "{}")
      write(join(dir, "vitest.config.ts"), "")
      write(join(dir, "docs", "adr", "0001-x.md"), "")
      write(join(dir, "package.json"), JSON.stringify({ devDependencies: { oxlint: "1.0.0", husky: "9.0.0" } }))
    })
    assert.deepEqual(messages(root), [
      ".oxlintrc.json: exists, but Vite+ is the one toolchain (decision 0001)",
      "vitest.config.ts: exists, but Vite+ is the one toolchain (decision 0001)",
      "docs/adr: exists, but decision records live in docs/decisions/",
      "package.json: depends on oxlint, which Vite+ replaces (decision 0001)",
      "package.json: depends on husky, which Vite+ replaces (decision 0001)",
      "vitest.config.ts: is not under tsconfig.json include, so the type check reads it with loose defaults"
    ])
  })
})

describe("the TypeScript files", () => {
  it("names a .ts the type check or the tests do not reach, and a script with no test", () => {
    const root = fixture((dir) => {
      write(join(dir, "tools", "helper.ts"), "")
      write(join(dir, "tools", "helper.test.ts"), "")
      write(join(dir, "scripts", "lonely.ts"), "")
      write(join(dir, ".agents", "skills", "tdd", "run.ts"), "")
    })
    assert.deepEqual(messages(root).toSorted(), [
      "scripts/lonely.ts: has no test beside it",
      "tools/helper.test.ts: is not under tsconfig.json include, so the type check reads it with loose defaults",
      "tools/helper.test.ts: matches no test.include glob of vite.config.ts, so no test run reads it",
      "tools/helper.ts: is not under tsconfig.json include, so the type check reads it with loose defaults"
    ])
  })

  it("asks for the arrays it reads when vite.config.ts has none", () => {
    const root = fixture((dir) => write(join(dir, "vite.config.ts"), "export default {}\n"))
    assert.equal(messages(root).length, 1)
  })
})

describe("the supply-chain settings", () => {
  it("names a missing saveExact, a short or loose release gate and a ranged version", () => {
    const root = fixture((dir) => {
      write(join(dir, "pnpm-workspace.yaml"), "minimumReleaseAge: 1440\nminimumReleaseAgeStrict: false\n")
      write(
        join(dir, "package.json"),
        JSON.stringify({ dependencies: { left: "^1.0.0" }, devDependencies: { right: "2.0.0" } })
      )
    })
    assert.deepEqual(messages(root), [
      "pnpm-workspace.yaml: does not set saveExact: true, so `pnpm add` writes a range (decision 0002)",
      "pnpm-workspace.yaml: sets minimumReleaseAge below 10080 minutes, or not at all (decision 0002)",
      "pnpm-workspace.yaml: does not set minimumReleaseAgeStrict: true, so pnpm falls back to a younger version (decision 0002)",
      "package.json: dependencies pins left to ^1.0.0, not an exact version (decision 0002)"
    ])
  })
})

describe("the decision records", () => {
  it("names a record with no rule or a missing section", () => {
    const root = fixture((dir) =>
      write(
        join(dir, "docs", "decisions", "0001-a-rule.md"),
        RECORD.replace("rule: A rule.\n", "").replace("## Trade-off\n", "")
      )
    )
    assert.deepEqual(messages(root), [
      "docs/decisions/0001-a-rule.md: has no `rule:` in its frontmatter",
      "docs/decisions/0001-a-rule.md: has no `## Trade-off` section"
    ])
  })
})

describe("under a git hook", () => {
  it("leaves alone the repository whose linked worktree the hook's GIT_DIR names", () => {
    const hooked = realpathSync(mkdtempSync(join(tmpdir(), "agents-check-hooked-")))
    made.push(hooked)
    const git = (...args: string[]) => execFileSync("git", args, { cwd: hooked, env: gitEnv(), encoding: "utf8" })
    git("init", "--quiet", "main")
    git(
      "-C",
      "main",
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@t",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      "--allow-empty",
      "-m",
      "init"
    )
    git("-C", "main", "worktree", "add", "--quiet", join(hooked, "linked"))
    const saved = process.env.GIT_DIR
    process.env.GIT_DIR = join(hooked, "main", ".git", "worktrees", "linked")
    try {
      assert.deepEqual(messages(fixture()), [])
    } finally {
      if (saved === undefined) {
        delete process.env.GIT_DIR
      } else {
        process.env.GIT_DIR = saved
      }
    }
    assert.equal(git("-C", "main", "config", "core.bare").trim(), "false")
  })
})

describe("this repo", () => {
  it("holds its shape", () => {
    assert.deepEqual(messages(repoRoot), [])
  })
})
