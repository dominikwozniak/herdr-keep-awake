# herdr-keep-awake

The terms this repo's docs, scripts and skills use for its own tooling. A project made from the
template adds its domain's terms here and keeps these.

## Language

**Reference**:
A repository declared in `.ai/references.json` and cloned under `references/`
for reading: another project at a branch's head, or a library's source at the tag of the version
`package.json` pins.
Never edited, never imported, never tracked.
_Avoid_: vendor, vendored repo, submodule, subtree, dependency (the package in `node_modules`)

**Decision record**:
A numbered file in `docs/decisions/` that settles one choice and states it as a rule, with the paths
it touches.
_Avoid_: ADR (the skills' word for it), RFC

**Release gate**:
The 7 days a version must be public before pnpm resolves it (`minimumReleaseAge`), strict: a range
with no version old enough fails.
_Avoid_: cooldown (Dependabot's own wait), quarantine

**Gate**:
`pnpm check`, which runs `dw-sdlc gate`: the Steps `vp check`, `references:setup --check` and
`vp test`, then the Checks. CI, the pre-push hook and an agent run the same command.
_Avoid_: CI (which runs it), lint (one part of it), release gate (pnpm's 7-day wait)

**Check**:
One judgment the Gate runs after its Steps, named under `gate.checks` in `.ai/agentic.config.json`:
one the `dw-sdlc` package ships, such as `comment-budget`, or the repo's own `agents-check`.
_Avoid_: test (what `vp test` runs)

**Primitive**:
An entry of `.ai/primitives.json`: a piece of the repo's code, the paths it lives at and the docs to
read before changing it.
_Avoid_: module, component

**Copy**:
A project made from the template by copier. Its `.copier-answers.yml` records the template commit it
was made from, which `copier update` replays the template's later changes against.
_Avoid_: fork, clone (a second checkout of the same repo)
