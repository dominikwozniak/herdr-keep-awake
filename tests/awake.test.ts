// What the switch runs and how it reads hc's answers.

import assert from "node:assert/strict"

import { describe, it } from "vite-plus/test"

import { isHold, listsHold, NAME, parsePid, runArgs } from "../mods/keep-awake/awake.js"

describe("runArgs", () => {
  it("starts caffeinate under the hold's name, watching the app's pid", () => {
    assert.deepEqual(runArgs("50254"), [
      "run",
      "--bg",
      "--json",
      "--no-parent",
      "--rm",
      "--name",
      NAME,
      "--",
      "caffeinate",
      "-d",
      "-i",
      "-s",
      "-w",
      "50254"
    ])
  })
  it("starts it without -w when the app's pid is unknown", () => {
    assert.equal(runArgs(null).includes("-w"), false)
  })
})

describe("parsePid", () => {
  it("reads the pid sh printed", () => {
    assert.equal(parsePid("50254\n"), "50254")
  })
  it("is null for anything that is not a pid", () => {
    assert.equal(parsePid(""), null)
    assert.equal(parsePid("sh: PPID: unbound\n"), null)
  })
})

describe("isHold", () => {
  it("is the terminal named after the hold, and nothing else", () => {
    assert.equal(isHold({ name: NAME, state: "live" }), true)
    assert.equal(isHold({ name: "reviewer" }), false)
    assert.equal(isHold({ address: "t7" }), false)
    assert.equal(isHold(null), false)
  })
})

describe("listsHold", () => {
  it("finds the hold among hc's terminals", () => {
    const stdout = JSON.stringify({ hidden_finished: 0, terminals: [{ address: "t1" }, { address: "t2", name: NAME }] })
    assert.equal(listsHold(stdout), true)
  })
  it("is false when hc lists no hold", () => {
    assert.equal(listsHold(JSON.stringify({ terminals: [{ address: "t1", name: "reviewer" }] })), false)
  })
  it("is false for output it cannot read", () => {
    assert.equal(listsHold("not json"), false)
    assert.equal(listsHold(JSON.stringify([{ name: NAME }])), false)
  })
})
