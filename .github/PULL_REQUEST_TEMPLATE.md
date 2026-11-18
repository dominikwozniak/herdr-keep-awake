<!-- LEDE — one paragraph, at most 4 sentences. Why now: the problem this change answers.
     Present tense, as if the branch had always looked this way. No file list, no history, no
     "previously / now" — what changed since the last review goes in the chat.
     e.g. "`pnpm references:sync` runs only by hand, so a fresh worktree starts without the clones.
     A SessionStart hook runs it whenever a session opens." -->

## What changes

<!-- One to four bullets, one per unit of work, at most two lines each. Lead with the `path` or the
     **script**, then what it now does. Nothing the diff already says, nothing merely planned.
     e.g.
     - `.claude/hooks/sync-references.sh` — runs the sync at session start and never fails the session.
     - **references:sync** — reports a directory the table no longer lists instead of deleting it. -->

## How it flows

<!-- OPTIONAL — one small mermaid diagram, ten nodes at most, and only when the change moves a flow,
     a sequence or a state machine AND the picture beats the prose. Otherwise delete this section,
     heading included. No prose around it; the diagram stands alone. A fenced `mermaid` block
     holding something like:
         flowchart LR
           start[session start] ==> hook[sync-references.sh] ==> sync[references:sync]
     Inside this comment the arrows are thick (==>), since a thin one would close the comment. -->

## Test plan

<!-- What was RUN and what it said — the command and its verdict, never an intention. A bug fix
     names its regression test. Whatever is left to do by hand goes last, marked "by hand".
     e.g.
     - `pnpm check` — pass
     - `pnpm references:sync` — 1 clone at head
     - by hand: opened a session in a fresh worktree, the hook cloned the references -->

## Risk

<!-- One line: what breaks if this is wrong, and the way back. Always filled — "None, docs only."
     is a real answer and the usual one. -->

## Follow-up

<!-- OPTIONAL — one bullet per thing this change leaves undone, each with the issue it is filed as
     (#123). Otherwise delete this section, heading included. -->
