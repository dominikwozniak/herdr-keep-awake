// Holds this repository's shape to what no built-in Check holds: the paths and skills AGENTS.md names,
// the toolchain decision 0001 rules out, the files the type check and tests reach, pnpm's supply-chain
// settings and the decision records' sections. Prints each problem as a GitHub annotation, exits 1 on any.

import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs"
import { join, matchesGlob } from "node:path"

import { gitEnv, Refusal, repoRoot, runScript } from "./script.ts"

const AGENTS = "AGENTS.md"
const LINK = join("references", "CLAUDE.md")
const SKILLS = join(".agents", "skills")
const WORKSPACE = "pnpm-workspace.yaml"
const VITE_CONFIG = "vite.config.ts"
const DECISIONS = join("docs", "decisions")

// Decision 0001: Vite+ holds every tool option, so these files and packages have no place here.
const FORBIDDEN_FILES = [".oxlintrc.json", ".oxfmtrc.json", "vitest.config.ts", "tsdown.config.ts"]
const FORBIDDEN_DEPENDENCIES = ["oxlint", "oxfmt", "typescript", "vitest", "lint-staged", "husky"]
const RECORD_SECTIONS = ["Context", "Decision", "Trade-off", "Revisit when"]
const MIN_RELEASE_AGE = 10080

export type Problem = { file: string; message: string; remedy: string }

/** The lines of the `## <heading>` section, up to the next `## ` heading. */
function section(lines: string[], heading: string): string[] {
  const start = lines.indexOf(`## ${heading}`)
  if (start === -1) {
    return []
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith("## "))
  return end === -1 ? rest : rest.slice(0, end)
}

/** The cells of a table row, unpadded; a separator row has only dashes in them. */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function tableRows(lines: string[]): string[][] {
  return lines
    .filter((line) => line.trim().startsWith("|"))
    .slice(2)
    .map(cells)
}

/** Every backticked token that names a path: no spaces or globs, and a slash or a file extension. */
function paths(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1] ?? "")
    .filter((token) => /^[\w./-]+$/.test(token) && (token.includes("/") || /\.\w+$/.test(token)))
}

function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "")
}

export function checkAgents(root: string): Problem[] {
  const problems: Problem[] = []
  const text = readFileSync(join(root, AGENTS), "utf8")
  const lines = text.split("\n")

  const linkStat = lstatSync(join(root, LINK), { throwIfNoEntry: false })
  const remedy = `make ${LINK} a symlink to ${AGENTS}`
  if (linkStat === undefined) {
    problems.push({ file: LINK, message: `missing; it should be a symlink to ${AGENTS}`, remedy })
  } else if (!linkStat.isSymbolicLink()) {
    problems.push({ file: LINK, message: `is a file, not a symlink to ${AGENTS}`, remedy })
  } else if (readlinkSync(join(root, LINK)) !== AGENTS) {
    problems.push({ file: LINK, message: `points at ${readlinkSync(join(root, LINK))}, not ${AGENTS}`, remedy })
  }

  const routed = [
    ...section(lines, "Project map"),
    ...tableRows(section(lines, "Task Router")).map((row) => row[1] ?? "")
  ]
  for (const path of new Set(paths(routed.join("\n")))) {
    if (!existsSync(join(root, path))) {
      problems.push({
        file: AGENTS,
        message: `names ${path}, which does not exist`,
        remedy: `create ${path} or drop it from ${AGENTS}`
      })
    }
  }

  const named = new Set(tableRows(section(lines, "Agent skills")).flatMap((row) => backticked(row[0] ?? "")))
  const vendored = new Set(
    existsSync(join(root, SKILLS))
      ? readdirSync(join(root, SKILLS), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .toSorted()
      : []
  )
  for (const skill of vendored) {
    if (!named.has(skill)) {
      problems.push({
        file: AGENTS,
        message: `skill ${skill} is in ${SKILLS}/ but Agent skills does not name it`,
        remedy: `add ${skill} to the Agent skills table`
      })
    }
  }
  for (const skill of named) {
    if (!vendored.has(skill)) {
      problems.push({
        file: AGENTS,
        message: `Agent skills names ${skill}, which ${SKILLS}/ does not hold`,
        remedy: `vendor ${skill} or drop its row`
      })
    }
  }
  return problems
}

/** The strings of the array `<name>: [...]` or `const <name> = [...]` in a config's source. */
function stringArray(source: string, name: string): string[] | undefined {
  const match = new RegExp(`\\b${name}(?::|\\s*=)\\s*\\[([^\\]]*)\\]`).exec(source)
  return match === null ? undefined : [...(match[1] ?? "").matchAll(/"([^"]+)"/g)].map((token) => token[1] ?? "")
}

/** A glob in the form `vite.config.ts` writes it: `dir/` is the directory, a bare name is at any depth. */
function matches(path: string, pattern: string): boolean {
  if (pattern.endsWith("/")) {
    return matchesGlob(path, `${pattern}**`)
  }
  return matchesGlob(path, pattern.includes("/") ? pattern : `**/${pattern}`)
}

/** Every file the repository tracks or would track, so a copy before its first commit reads the same. */
function trackedFiles(root: string): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    env: gitEnv(),
    encoding: "utf8"
  })
  return out
    .split("\n")
    .filter((file) => file !== "" && existsSync(join(root, file)))
    .toSorted()
}

function readJson(root: string, file: string): Record<string, unknown> | undefined {
  const path = join(root, file)
  if (!existsSync(path)) {
    return undefined
  }
  const value: unknown = JSON.parse(readFileSync(path, "utf8"))
  return typeof value === "object" && value !== null ? Object.fromEntries(Object.entries(value)) : undefined
}

function stringMap(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
}

/** Decision 0001: no tool config beside `vite.config.ts`, no `docs/adr/`, no tool Vite+ replaces. */
function checkToolchain(root: string): Problem[] {
  const problems: Problem[] = []
  for (const file of FORBIDDEN_FILES) {
    if (existsSync(join(root, file))) {
      problems.push({
        file,
        message: "exists, but Vite+ is the one toolchain (decision 0001)",
        remedy: `move its options into ${VITE_CONFIG} and delete ${file}`
      })
    }
  }
  if (existsSync(join(root, "docs", "adr"))) {
    problems.push({
      file: "docs/adr",
      message: "exists, but decision records live in docs/decisions/",
      remedy: "move the records to docs/decisions/ and delete docs/adr/"
    })
  }
  const pkg = readJson(root, "package.json")
  const dependencies = { ...stringMap(pkg?.["dependencies"]), ...stringMap(pkg?.["devDependencies"]) }
  for (const name of FORBIDDEN_DEPENDENCIES) {
    if (name in dependencies) {
      problems.push({
        file: "package.json",
        message: `depends on ${name}, which Vite+ replaces (decision 0001)`,
        remedy: `remove ${name} from package.json`
      })
    }
  }
  return problems
}

/** Every tracked `.ts` outside `ignored` is type-checked, every test of it runs, every script has one. */
function checkCoverage(root: string): Problem[] {
  const config = existsSync(join(root, VITE_CONFIG)) ? readFileSync(join(root, VITE_CONFIG), "utf8") : ""
  const ignored = stringArray(config, "ignored")
  const testInclude = stringArray(config, "include")
  const tsInclude = readJson(root, "tsconfig.json")?.["include"]
  if (ignored === undefined || testInclude === undefined || !Array.isArray(tsInclude)) {
    return [
      {
        file: VITE_CONFIG,
        message: "has no `ignored` array, no `test.include` array or no tsconfig.json `include` to read",
        remedy: "declare `const ignored = [...]` and `test.include` in vite.config.ts, and `include` in tsconfig.json"
      }
    ]
  }
  const problems: Problem[] = []
  const typed = tsInclude.filter((entry): entry is string => typeof entry === "string")
  const files = trackedFiles(root).filter(
    (file) => file.endsWith(".ts") && !ignored.some((glob) => matches(file, glob))
  )
  for (const file of files) {
    if (!typed.some((entry) => file === entry || file.startsWith(`${entry}/`) || matchesGlob(file, entry))) {
      problems.push({
        file,
        message: "is not under tsconfig.json include, so the type check reads it with loose defaults",
        remedy: "add its directory or file to include in tsconfig.json"
      })
    }
    if (file.endsWith(".test.ts") && !testInclude.some((glob) => matchesGlob(file, glob))) {
      problems.push({
        file,
        message: `matches no test.include glob of ${VITE_CONFIG}, so no test run reads it`,
        remedy: `add a glob for it to test.include in ${VITE_CONFIG}`
      })
    }
  }
  const all = new Set(files)
  for (const file of files) {
    const isScript = file.startsWith("scripts/") && !file.slice("scripts/".length).includes("/")
    const test = file.replace(/\.ts$/, ".test.ts")
    if (isScript && !file.endsWith(".test.ts") && !all.has(test)) {
      problems.push({ file, message: "has no test beside it", remedy: `add ${test}` })
    }
  }
  return problems
}

/** The value of a top-level `key: value` line in pnpm-workspace.yaml. */
function setting(yaml: string, key: string): string | undefined {
  return new RegExp(`^${key}:[ \\t]*([^\\s#]+)`, "m").exec(yaml)?.[1]
}

/** Decision 0002: exact pins, a seven-day release gate, held strictly. */
function checkSupplyChain(root: string): Problem[] {
  const problems: Problem[] = []
  const yaml = existsSync(join(root, WORKSPACE)) ? readFileSync(join(root, WORKSPACE), "utf8") : ""
  if (setting(yaml, "saveExact") !== "true") {
    problems.push({
      file: WORKSPACE,
      message: "does not set saveExact: true, so `pnpm add` writes a range (decision 0002)",
      remedy: "add `saveExact: true`"
    })
  }
  if (Number(setting(yaml, "minimumReleaseAge") ?? 0) < MIN_RELEASE_AGE) {
    problems.push({
      file: WORKSPACE,
      message: `sets minimumReleaseAge below ${MIN_RELEASE_AGE} minutes, or not at all (decision 0002)`,
      remedy: `set \`minimumReleaseAge: ${MIN_RELEASE_AGE}\` or more`
    })
  }
  if (setting(yaml, "minimumReleaseAgeStrict") !== "true") {
    problems.push({
      file: WORKSPACE,
      message: "does not set minimumReleaseAgeStrict: true, so pnpm falls back to a younger version (decision 0002)",
      remedy: "add `minimumReleaseAgeStrict: true`"
    })
  }
  const pkg = readJson(root, "package.json")
  for (const block of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(stringMap(pkg?.[block]))) {
      if (!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(version)) {
        problems.push({
          file: "package.json",
          message: `${block} pins ${name} to ${version}, not an exact version (decision 0002)`,
          remedy: `pin ${name} to one version with \`pnpm add -E ${name}\``
        })
      }
    }
  }
  return problems
}

/** Each decision record carries a `rule:` and the four sections the decision-records Check does not read. */
function checkDecisions(root: string): Problem[] {
  const dir = join(root, DECISIONS)
  if (!existsSync(dir)) {
    return []
  }
  const problems: Problem[] = []
  for (const name of readdirSync(dir)
    .filter((file) => /^\d+-.+\.md$/.test(file))
    .toSorted()) {
    const file = join(DECISIONS, name)
    const lines = readFileSync(join(root, file), "utf8").split("\n")
    if (!lines.some((line) => /^rule:\s*\S/.test(line))) {
      problems.push({ file, message: "has no `rule:` in its frontmatter", remedy: "state the rule as one sentence" })
    }
    for (const heading of RECORD_SECTIONS) {
      if (!lines.includes(`## ${heading}`)) {
        problems.push({ file, message: `has no \`## ${heading}\` section`, remedy: `add a \`## ${heading}\` section` })
      }
    }
  }
  return problems
}

/** Every check of this repository's shape. */
export function checkRepo(root: string): Problem[] {
  return [
    ...checkAgents(root),
    ...checkToolchain(root),
    ...checkCoverage(root),
    ...checkSupplyChain(root),
    ...checkDecisions(root)
  ]
}

async function main(): Promise<void> {
  const problems = checkRepo(repoRoot)
  for (const { file, message, remedy } of problems) {
    console.error(`::error file=${file}::${message} — ${remedy}`)
  }
  if (problems.length > 0) {
    throw new Refusal(`${problems.length} problem${problems.length === 1 ? "" : "s"}`)
  }
  console.log("pass: the repository holds its shape")
}

if (import.meta.main) {
  process.exitCode = await runScript("agents:check", main)
}
