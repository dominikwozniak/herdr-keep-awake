import { defineConfig } from "vite-plus"

// Paths no tool touches: read-only clones, vendored skills and lint rules, other worktrees, per-machine files and
// the answers copier writes into a copy.
const ignored = [
  "references/*/",
  ".agents/skills/",
  ".claude/skills/",
  "tools/oxlint/anti-slop/",
  ".claude/worktrees/",
  "*.local.json",
  "mods/*/gpui-kit.d.ts",
  "mods/*/jsconfig.json",
  ".copier-answers.yml"
]

export default defineConfig({
  fmt: {
    printWidth: 120,
    semi: false,
    trailingComma: "none",
    embeddedLanguageFormatting: "off",
    sortImports: true,
    sortPackageJson: true,
    ignorePatterns: ignored
  },
  lint: {
    plugins: ["typescript", "import", "unicorn", "oxc"],
    jsPlugins: [{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" }],
    categories: { correctness: "error", suspicious: "error" },
    rules: {
      curly: ["error", "all"],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/references/**"], message: "references/ holds read-only clones; never import from it" }
          ]
        }
      ],
      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error"
    },
    ignorePatterns: ignored,
    options: { typeAware: true, typeCheck: true, denyWarnings: true }
  },
  test: {
    include: ["scripts/**/*.test.ts", "tests/**/*.test.ts", "tools/**/*.test.ts"],
    setupFiles: ["tools/oxlint/rule-tester.setup.ts"]
  },
  staged: { "*": "vp check --fix --no-error-on-unmatched-pattern" }
})
