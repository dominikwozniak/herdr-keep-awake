# Domain docs

How the engineering skills read and write this repo's domain documentation. One context.

## Before exploring, read these

- `GLOSSARY.md` at the repo root.
- The decision records in `docs/decisions/` whose `touches:` lists the files you are about to change.

If `GLOSSARY.md` does not exist, proceed silently; `/domain-modeling` creates it when the first term is
resolved.

## Decisions, not ADRs

Where a skill says ADR or `docs/adr/`, it means a decision record in `docs/decisions/`. Never create
`docs/adr/`.

A record states a rule as a sentence in its slug.

- Path `docs/decisions/NNNN-<slug>.md`. Frontmatter `decision`, `status`, `date`, `rule`, `touches`; a
  record a later one changes carries `amended-by`. Title `# NNNN — <title>`, sections `Context`,
  `Decision`, `Trade-off`, `Revisit when`.
- The number is the next above the highest in the directory. A project made from the template keeps
  the template's records and numbers on from them.
- Cite a record as `decision 0001`, and another repo's record as `<repo>#0073`
  (`grateful-me-app-v2#0073`).
- Offer a record only when the decision is hard to reverse, surprising without context and the result
  of a real trade-off: all three, or none.

## Use the glossary's vocabulary

When your output names a domain concept (an issue title, a hypothesis, a test name), use the term as
`GLOSSARY.md` defines it, not a synonym it lists under _Avoid_. A concept missing from the glossary is
either invented language (reconsider) or a real gap (note it for `/domain-modeling`).

## Flag decision conflicts

If your output contradicts a decision, say so instead of overriding it silently:

> _Contradicts decision 0002 (dependencies wait 7 days), but worth reopening because…_
