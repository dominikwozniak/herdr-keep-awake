# Issue tracker: GitHub

Specs and tickets live as GitHub issues in this repo. Use `gh` for every operation; it infers the
repo from `git remote -v`.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`, a heredoc for a multi-line body.
- **Read**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`.
- **Sub-issue**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>`.
- **Comment**: `gh issue comment <number> --body "..."`.
- **Close**: `gh issue close <number> --comment "..."`.

## Labels

The repo has no triage labels. When a skill applies one (`/to-spec` applies `ready-for-agent`), skip it.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read** above.
