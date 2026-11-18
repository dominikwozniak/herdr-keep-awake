---
decision: 0002
status: active
date: 2026-10-17
rule: A dependency resolves only after it has been public for 7 days, strictly, and is pinned to an exact version; an exception is asked for, and once granted carries its reason and when it goes
touches:
  - pnpm-workspace.yaml
  - package.json
  - .github/dependabot.yml
---

# 0002 — Dependencies wait 7 days and are pinned exactly

## Context

Every pnpm repo of the owner's (grateful-me-asc, foundation, grateful-me-app-v2, dw-sdlc) carries the
same supply-chain baseline in `pnpm-workspace.yaml`: `minimumReleaseAge: 10080` with
`minimumReleaseAgeStrict`, `trustPolicy: no-downgrade`, `blockExoticSubdeps` and `strictDepBuilds`.
The gate gives a compromised release a week to be found and pulled before it can resolve here. pnpm 11 reads these settings from `pnpm-workspace.yaml` only.

Vite+ ships a release about every week, so the gate holds this template on a version a week behind:
on 2026-10-17 that was `vite-plus` 1.1.0, with 1.2.0 and 1.3.0 still inside the window.

Considered and rejected:

- **An exclusion for `vite-plus` and `@voidzero-dev/*`.** It brings each release the day it ships,
  and takes the one package that runs on every commit out of the gate.

## Decision

- `pnpm-workspace.yaml` keeps the baseline above, plus `audit.level: high` for the weekly audit.
- Every dependency is pinned exactly (`pnpm add -E`). Dependabot proposes updates weekly with the
  same 7-day cooldown.
- Lowering the gate, adding a `minimumReleaseAgeExclude` entry or bypassing it once with
  `--config.minimumReleaseAge=0` needs the owner's yes. A granted exception, and any `overrides` pin
  forced by `trustPolicy`, carries a comment naming its reason and when it goes.

## Trade-off

Every update, a security fix included, arrives at least 7 days after it ships, and `pnpm add` of a
fresh version fails until then. Exact pins mean a weekly Dependabot PR instead of silent range
updates.

## Revisit when

- pnpm ships a better signal than age, such as verified provenance for every dependency.
- A security fix cannot wait 7 days: that is the exception above, asked for and dated.
