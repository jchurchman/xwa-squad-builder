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
make install   # installs the client's npm packages, including its lint and format tools
make import    # downloads the pinned card data and its AMG points into backend/xwa.db
```

The import needs network access. The server refuses to start until it has run.

## Check the current state

Run from the repository root:

```bash
make test                                     # client tests (Vitest), then go vet and Go tests
make lint                                     # lint the client
(cd client && npx tsc --noEmit)               # type-check the client
make format-check                             # formatting; FILES="<paths>" checks only those
(cd backend && gofmt -l . && golangci-lint run ./...)   # Go formatting and lint; gofmt must print nothing
```

## Run a dev instance

```bash
make dev
```

This starts the Go backend on port 3001 and the client on <http://localhost:5173>. The client
proxies `/api` to the backend.

- **Client changes** reload in the browser automatically.
- **Go changes** need a restart: stop `make dev` and start it again.
- **`.proto` changes:** run `make generate`, then restart.
- **Card data changes** (`backend/cards.version` or `backend/internal/store/schema.sql`): run
  `make import` again. To import from a local checkout of the card data fork, set
  `CARD_DATA_PATH` to its path.

## More

- [CONTRIBUTING.md](CONTRIBUTING.md): git workflow and code conventions
- [docs/development.md](docs/development.md): all commands
- [docs/architecture.md](docs/architecture.md): design decisions
