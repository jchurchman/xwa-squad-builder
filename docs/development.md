# Development

## Requirements

Go, [golangci-lint](https://golangci-lint.run/), and the
[Buf CLI](https://buf.build/docs/cli/installation/)
(`brew install go golangci-lint bufbuild/buf/buf`).

## Commands

Run from the repository root:

```bash
make install      # install the client's npm packages (client/), including ESLint and Prettier
make import       # download the pinned card data into backend/xwa.db and record its AMG points (run once, and after changing cards.version or store/schema.sql)
make dev          # Go backend on :3001 and client on http://localhost:5173 (proxies /api to :3001)
make generate     # lint proto/ and regenerate Go + TypeScript code after editing a .proto file
make test         # client tests (Vitest) then backend vet and tests
make lint         # lint the client; `make lint-fix` applies fixes
make format       # format with the client's Prettier config; set FILES="<paths>" to limit it
make build        # build the client (client/dist) and the Go server (backend/bin/server); needs approval
make start        # run the built Go server; it serves the API only, not the client yet (D10)
```

The [Makefile](../Makefile) has one target per step, such as `make backend-test` or
`make client-dev`. The server refuses to start until `make import` has loaded card data.

## Git hooks

`make install` also installs [lefthook](https://lefthook.dev/), which runs the pre-push hook in
[lefthook.yml](../lefthook.yml). Commits are never blocked. Before a push, it checks each side
the pushed commits touch:

- **Client:** ESLint over the whole client.
- **Formatting:** Prettier over the repository's TypeScript, JSON, and Markdown.
- **Backend:** `gofmt` and `golangci-lint` over the whole backend.

The hook only reports. If a check fails, the push is blocked and the hook prints the command that
fixes it (for example `make lint-fix` or `make format`); fix, commit, and push again. Editors that
format and lint on save catch most of this earlier. Tests are not run on push; CI runs them. To
skip the hook for one push, run `LEFTHOOK=0 git push ...`.

After adding a new hook type to `lefthook.yml`, run `make install` again so git picks it up. If it
reports that `core.hooksPath` is set, unset it (`git config --unset core.hooksPath`) and retry.

## CI

[.github/workflows/tests.yml](../.github/workflows/tests.yml) runs `make client-test` and
`make backend-test` on every pull request, as two parallel jobs.

## Card data

`backend/cards.version` pins the commit of the card data fork to import. To import from a local
checkout of the fork instead of downloading, set `CARD_DATA_PATH` to its path when running
`make import`. A local import loads the cards but skips the AMG points version.

## Verification

See [AGENTS.md](../AGENTS.md#verification).
