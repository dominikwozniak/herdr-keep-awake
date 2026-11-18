// What every script shares: the entry point's exit code and line, and an error's message.

import assert from "node:assert/strict"

import { describe, it } from "vite-plus/test"

import { messageOf, Refusal, runScript } from "./script.ts"

describe("messageOf", () => {
  it("reads an Error's message, and anything else as text", () => {
    assert.equal(messageOf(new Error("boom")), "boom")
    assert.equal(messageOf("boom"), "boom")
  })
})

/** `main` run as `example`, its stderr caught. */
async function ran(main: () => Promise<void>): Promise<{ code: 0 | 1; stderr: string[] }> {
  const stderr: string[] = []
  const { error } = console
  console.error = (...args: unknown[]) => {
    stderr.push(args.join(" "))
  }
  try {
    return { code: await runScript("example", main), stderr }
  } finally {
    console.error = error
  }
}

describe("runScript", () => {
  it("is exit 0 when main returns", async () => {
    assert.deepEqual(await ran(() => Promise.resolve()), { code: 0, stderr: [] })
  })
  it("prints a Refusal as the script's line and is exit 1", async () => {
    assert.deepEqual(await ran(() => Promise.reject(new Refusal("nothing to do"))), {
      code: 1,
      stderr: ["example — nothing to do"]
    })
  })
  it("throws any other error, a bug, with its stack", async () => {
    await assert.rejects(
      ran(() => Promise.reject(new TypeError("x is not a function"))),
      TypeError
    )
  })
})
