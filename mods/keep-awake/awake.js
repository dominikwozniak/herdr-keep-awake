// What the switch runs and how it reads hc's answers, free of Herdr's modules so tests can import it.

/** The shared.json key that holds the switch. */
export const KEY = "keep-awake.on"

/** The hold's terminal name. hc keeps names unique among live terminals, so two copies never start two. */
export const NAME = "keep-awake"

// -d display, -i idle system sleep, -s system sleep on AC power.
const FLAGS = ["-d", "-i", "-s"]

/**
 * The hc arguments that start the hold. With the app's pid, `caffeinate -w` ends with the app.
 * @param {string | null} pid
 * @returns {string[]}
 */
export function runArgs(pid) {
  const watch = pid === null ? [] : ["-w", pid]
  return ["run", "--bg", "--json", "--no-parent", "--rm", "--name", NAME, "--", "caffeinate", ...FLAGS, ...watch]
}

/**
 * The pid `sh -c 'echo $PPID'` printed, or null.
 * @param {string} stdout
 * @returns {string | null}
 */
export function parsePid(stdout) {
  const pid = stdout.trim()
  return /^\d+$/.test(pid) ? pid : null
}

/**
 * Whether a terminal, as `hc ls --json` or Herdr's `terminals()` describes it, is the hold.
 * @param {unknown} terminal
 * @returns {boolean}
 */
export function isHold(terminal) {
  return isRecord(terminal) && terminal["name"] === NAME
}

/**
 * Whether `hc ls --json` lists the hold.
 * @param {string} stdout
 * @returns {boolean}
 */
export function listsHold(stdout) {
  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return false
  }
  const terminals = isRecord(parsed) ? parsed["terminals"] : undefined
  return Array.isArray(terminals) && terminals.some(isHold)
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null
}
