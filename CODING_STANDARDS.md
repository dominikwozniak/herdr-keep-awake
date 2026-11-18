# Coding standards

The judgement-call rules a Review holds a change to. A mechanical rule is a Check, a lint rule or a
guard instead, and is not repeated here. A new rule comes through `/retro`.

## Scripts

- A script reuses `repoRoot`, `Refusal` and `runScript` from `scripts/script.ts`; what turns shared
  moves there (`AGENTS.md#project-map`).
- A script that touches what a test cannot (spawn, network, a plugin CLI) takes `Tools`. Tests run on
  real files, git and temp directories and fake `Tools` alone (`docs/agents/tooling.md#typescript-and-tests`).
- A failure says what failed, in which file, and the remedy (`docs/agents/tooling.md#the-gate`).
- Untrusted JSON is narrowed, never asserted, while the repository has no schema library
  (`tools/oxlint/anti-slop/UPSTREAM.md`).
- A script gets its own `.ai/primitives.json` entry once it has its own docs
  (`docs/agents/tooling.md#the-gate`).

## Names and records

- Names, test names and issue titles use `GLOSSARY.md` terms, never a synonym its _Avoid_ lists
  (`docs/agents/domain.md`).
- A change that contradicts a decision record says so (`docs/agents/domain.md`).
- An `overrides` pin carries a comment naming why and when it goes (`docs/agents/tooling.md#dependencies`).

## Comments

- A comment says what the code cannot.

## Authoring

- A script: `AGENTS.md#project-map`.
- A check rule: if another repository would want it, it belongs in dw-sdlc; each problem names its
  file and its remedy.
- A decision record: `docs/agents/domain.md`.
- A `GLOSSARY.md` entry: the `domain-modeling` skill.
- A skill: the `writing-for-agents` skill.
- A pull request body: `.github/PULL_REQUEST_TEMPLATE.md`.
- An anti-slop lint change: `tools/oxlint/anti-slop/UPSTREAM.md`.

## This repo
