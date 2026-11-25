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
- A pre-push hook lints and format-checks what you push and blocks the push on problems (see
  [development.md](../development.md#git-hooks)). Fix them in a new commit; don't skip the hook to
  get a push through.

## Authorship

Agent-written and human-written code must stay distinguishable in `git blame`.

- Agents commit with `--author="Claude <noreply@anthropic.com>"` and keep the
  `Co-Authored-By` trailer.
- Agents commit each logical step separately, with a message that says what changed and why, so a
  PR can be reviewed one commit at a time. Put corrections in new commits; don't amend, squash, or
  reorder commits that are already pushed.
- Never mix agent and human edits in one commit. Commit agent work before a human edits on top
  of it; the human's changes go in their own commit.
- Agent `gh` calls and pushes authenticate as the bot account `jc-claude-bot`, so agent-opened
  PRs come from the bot. This is set up in each developer's user-level Claude settings
  (`GH_CONFIG_DIR` and a `gh` git credential helper); no token is stored in this repo.
