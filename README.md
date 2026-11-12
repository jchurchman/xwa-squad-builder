# XWA Squad Builder

Squad builder for the X-Wing Miniatures Game using X-Wing Alliance (XWA) points and rules. A Go
backend serves card data over Connect RPC to a React client.

## Set up a fresh clone

Install these first:

- Node.js and npm (developed on Node 22)
- Go, at the version in [backend/go.mod](backend/go.mod)
- [golangci-lint](https://golangci-lint.run/), for backend linting
- The [Buf CLI](https://buf.build/docs/cli/installation/), only if you will edit `.proto` files

On macOS: `brew install node go golangci-lint bufbuild/buf/buf`.

Then, from the repository root:

```bash
git clone https://github.com/jchurchman/xwa-squad-builder.git
cd xwa-squad-builder
npm install              # installs every npm workspace
npm run backend:import   # downloads the pinned card data into backend/xwa.db
```

The import needs network access. The server refuses to start until it has run.

## Check the current state

Run from the repository root:

```bash
npm test                                      # client tests (Vitest), then go vet and Go tests
npx eslint client                             # lint the client
(cd client && npx tsc --noEmit)               # type-check the client
npx prettier --check <files you changed>      # formatting
(cd backend && gofmt -l . && golangci-lint run ./...)   # Go formatting and lint; gofmt must print nothing
```

Avoid `npm run lint` and `npm run format:check` for now. They also check the frozen legacy
`server/` and generated code, so they report errors unrelated to your change.

## Run a dev instance

```bash
npm run dev
```

This starts the Go backend on port 3001 and the client on <http://localhost:5173>. The client
proxies `/api` to the backend.

- **Client changes** reload in the browser automatically.
- **Go changes** need a restart: stop `npm run dev` and start it again.
- **`.proto` changes:** run `npm run generate`, then restart.
- **Card data changes** (`backend/cards.version` or `backend/internal/store/schema.sql`): run
  `npm run backend:import` again. To import from a local checkout of the card data fork, set
  `CARD_DATA_PATH` to its path.

## More

- [CONTRIBUTING.md](CONTRIBUTING.md): git workflow and code conventions
- [docs/development.md](docs/development.md): all commands
- [docs/architecture.md](docs/architecture.md): design decisions
