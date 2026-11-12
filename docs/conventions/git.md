# Git workflow

## Branches and pull requests

- Branch off `main`. Name branches `<your initials>/<short-description>`, e.g.
  `jc/points-version-schema`.
- Keep pull requests to one logical change.
- A PR changes at most ~300 hand-written lines. Tests, generated code and lockfiles don't count.
- If planned work is bigger, propose a split before writing code: the PRs in merge order, each
  with one sentence on what it does and a rough size. Each PR must leave `main` working.
- Before opening a PR, run the [verification commands](../../AGENTS.md#verification) on
  everything you changed.
- Merge with a merge commit or rebase, never squash. Squashing erases commit authorship.

## Authorship

Agent-written and human-written code must stay distinguishable in `git blame`.

- Agents commit with `--author="Claude <noreply@anthropic.com>"` and keep the
  `Co-Authored-By` trailer.
- Never mix agent and human edits in one commit. Commit agent work before a human edits on top
  of it; the human's changes go in their own commit.
- `gh` authenticates as the bot account `jc-claude-bot` through `GH_TOKEN` in
  `.claude/settings.local.json` (gitignored), so agent-opened PRs come from the bot.
