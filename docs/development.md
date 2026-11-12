# Development

## Requirements

Go, [golangci-lint](https://golangci-lint.run/), and the
[Buf CLI](https://buf.build/docs/cli/installation/)
(`brew install go golangci-lint bufbuild/buf/buf`).

## Commands

Run from the repository root:

```bash
npm i                  # install all npm workspaces
npm run backend:import # download the pinned card data into backend/xwa.db (run once, and after changing cards.version or store/schema.sql)
npm run dev            # Go backend on :3001 and client on http://localhost:5173 (proxies /api to :3001)
npm run generate       # lint proto/ and regenerate Go + TypeScript code after editing a .proto file
npm test               # client tests (Vitest) then backend vet and tests
npm run build          # build the client (client/dist) and the Go server (backend/bin/server); needs approval
npm start              # run the built Go server; it serves the API only, not the client yet (D10)
```

The server refuses to start until `npm run backend:import` has loaded card data.

## Card data

`backend/cards.version` pins the commit of the card data fork to import. To import from a local
checkout of the fork instead of downloading, set `CARD_DATA_PATH` to its path when running
`backend:import`.

## Verification

See [AGENTS.md](../AGENTS.md#verification).
