import { h_flex } from "gpui-base"
import { View, div } from "gpui-kit"
import { exec, hc, terminals, shared, setShared, nextCommand, notify, theme } from "herdr"

import { KEY, NAME, runArgs, parsePid, isHold, listsHold } from "./awake.js"

// A switch for the tab bar: on, it keeps a macOS `caffeinate` (the hold) running, which keeps the
// display and the system awake; off, it ends it. The switch lives in shared.json, so it survives a restart.

const on = () => shared(KEY) === true
const live = () => terminals().some(isHold)

// terminals() can lag a moment behind hc, so a failed run or kill asks hc itself.
async function running() {
  const r = await hc(["ls", "--json"])
  return r.code === 0 ? listsHold(r.stdout) : live()
}

export default class KeepAwake extends View {
  init(_props, cx) {
    this.busy = false
    this.error = null
    cx.spawn(async (task) => {
      for (;;) {
        const command = await nextCommand()
        if (command === "toggle") {
          this.toggle()
        }
        task.notify()
      }
    })
  }

  toggle() {
    this.error = null
    setShared(KEY, !on())
  }

  // exec's programs are the app's children, so their parent is the app.
  async appPid() {
    if (this.pid === undefined) {
      const r = await exec("sh", ["-c", "echo $PPID"]).catch(() => null)
      this.pid = r === null ? null : parsePid(r.stdout)
    }
    return this.pid
  }

  async start() {
    const r = await hc(runArgs(await this.appPid()))
    if (r.code !== 0 && !(await running())) {
      throw new Error((r.stderr || r.stdout).trim() || `hc run exited ${r.code}`)
    }
  }

  async stop() {
    const r = await hc(["kill", NAME])
    if (r.code !== 0 && (await running())) {
      throw new Error((r.stderr || r.stdout).trim() || `hc kill exited ${r.code}`)
    }
  }

  // A failure is not retried until the switch is flipped again.
  reconcile(cx) {
    const want = on()
    if (this.busy || this.error || want === live()) {
      return
    }
    this.busy = true
    cx.spawn(async (task) => {
      try {
        await (want ? this.start() : this.stop())
      } catch (e) {
        this.error = String(e?.message ?? e)
        notify({ title: "Keep awake failed", body: this.error, level: "error" })
      } finally {
        this.busy = false
        task.notify()
      }
    })
  }

  async close() {
    if (live()) {
      await exec("hc", ["kill", NAME])
    }
  }

  render(cx) {
    this.reconcile(cx)
    const t = theme()
    const active = on() && live()
    const track = this.error ? t.blocked : active ? t.accent : t.input
    const knob = div()
      .id("keep-awake-knob")
      .absolute()
      .top(2)
      .left(on() ? 14 : 2)
      .size(12)
      .rounded_full()
      .bg(active ? t.accent_foreground : t.foreground)
      .transition("left", { duration: 150, easing: "ease-out" })
    const button = h_flex()
      .id("keep-awake")
      .h(26)
      .px(8)
      .gap(6)
      .flex_none()
      .items_center()
      .rounded(6)
      .cursor_pointer()
      .text_size(12)
      .text_color(active ? t.foreground : t.muted)
      .hover((s) => s.bg(t.hover))
      .on_mouse_down("left", (_e, event) => event.stop_propagation())
      .on_click((_e, event) => {
        this.toggle()
        event.notify()
      })
      .child(div().relative().w(28).h(16).flex_none().rounded_full().bg(track).child(knob))
      .child("Awake")
    return h_flex()
      .size_full()
      .pr(10)
      .items_center()
      .justify_end()
      .bg(t.chrome)
      .border_b(1)
      .border_color(t.border)
      .child(button)
  }
}
