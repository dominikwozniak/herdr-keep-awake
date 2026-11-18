import { RuleTester } from "vite-plus/lint/plugins-dev"
import { describe, it } from "vite-plus/test"

// RuleTester reads `describe` and `it` off globalThis, which vitest leaves empty; without them it runs
// every case while the file loads and vitest reports a file with no tests.
RuleTester.describe = describe
RuleTester.it = it
