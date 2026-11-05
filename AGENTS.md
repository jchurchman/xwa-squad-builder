# XWA Squad Builder

Squad builder for the X-Wing Miniatures Game, built around the X-Wing Alliance (XWA) points and
rules. It replaces the approach of [YASB](https://github.com/raithos/xwing), where card data and
rules live inside CoffeeScript UI code. Here, card data is data: JSON for card definitions, a
versioned database for points.

Read [docs/architecture.md](docs/architecture.md) before any server or data work. It records what
has been decided, what is only proposed, and what is still open.

## Project status

The project is mid-transition. Know which part you are touching:

| Path       | State                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `client/`  | Active. React app; kept through the rewrite.                                                         |
| `backend/` | Active. Go server and card import. Serves ships and pilots; upgrades and points are not built yet.   |
| `proto/`   | Active. Connect RPC API definitions. Generated code lives in `backend/gen/` and `client/src/gen/`.   |
| `server/`  | Legacy Node/Express server. Frozen and no longer used by the client. Will be removed.                |
| `shared/`  | TypeScript types shared by `client/` and the legacy `server/`. Will be replaced by the API contract. |
| `docs/`    | Architecture decisions and open questions for XWA.                                                   |

Upgrade selection is hidden in the client until upgrades are served by the Go backend.

## Stack

- **Client:** React 19, TypeScript, Vite, antd 5, Redux Toolkit + RTK Query, react-router 7, SCSS
  modules.
- **Backend:** Go, SQLite (pure-Go `modernc.org/sqlite` driver). Discord OAuth is planned.
- **API:** Connect RPC (connect-go v2, connect-web). Protobuf definitions in `proto/` generate both
  the Go server code and the TypeScript types the client uses.
- **Card definitions:** the [jchurchman/xwing-data2](https://github.com/jchurchman/xwing-data2) fork,
  keyed by [XWS](https://github.com/elistevens/xws-spec) IDs. `backend/cards.version` pins the
  commit to import.

Requires Go and the [Buf CLI](https://buf.build/docs/cli/installation/) (`brew install go
bufbuild/buf/buf`).

## Commands

Run from the repository root:

```bash
npm i                  # install all npm workspaces
npm run backend:import # download the pinned card data into backend/xwa.db (run once, and after changing cards.version)
npm run dev            # Go backend on :3001 and client on http://localhost:5173 (proxies /api to :3001)
npm run generate       # lint proto/ and regenerate Go + TypeScript code after editing a .proto file
npm run build          # build the client (client/dist) and the Go server (backend/bin/server); needs approval
npm start              # run the built Go server; it serves the API only, not the client yet (D10)
```

The server refuses to start until `npm run backend:import` has loaded card data.

To import from a local checkout of the fork instead of downloading, set `CARD_DATA_PATH` to its
path when running `backend:import`.

Verification for client changes:

```bash
npx eslint <files>                # lint specific files
(cd client && npx tsc --noEmit)   # type-check; never run plain `tsc -b`, it writes .js files into src/
npx prettier --check <files>
```

Verification for backend changes (run from `backend/`):

```bash
gofmt -l .        # lists unformatted files; must print nothing
go vet ./...
go test ./...     # or a single package, e.g. go test ./internal/store
```

The client has no test runner yet. Vitest is the intended choice; adding it requires approval
(package install). Never edit generated code in `backend/gen/` or `client/src/gen/`; change the
`.proto` file and run `npm run generate`.

## Domain vocabulary

- **Platform:** the type of ship, e.g. TIE/ln, T-65 X-wing.
- **Pilot:** the character flying a platform, e.g. Luke Skywalker.
- **Ship:** a chosen platform + pilot + upgrades within a list.
- **List:** the collection of ships a user builds (a "squad").
- **XWS ID:** the community-standard identifier for a card. Unique per card type only, so a pilot
  and an upgrade can share an ID.
- **Points version:** a dated set of costs for every card. Lifecycle: draft → testing → published.

## Working agreements

These apply to every task. They are written to be portable to other projects.

- If you are not sure what I meant, ask one question before editing instead of guessing.
- Before changing anything, list every file you will need and read them in one pass. Then make all
  edits, then run verification once.
- Before writing "we do X" or "we don't have X" anywhere, reopen the code and cite `file:line`.
- Treat work as a queue. When I propose tweaks or corrections mid-task, append them to the queue
  instead of jumping to them. Stop only when the queue is empty.
- You Aren't Gonna Need It. Do not overengineer and never expand scope without permission. Suggest
  scope improvements when they make sense, but do not act on them unasked. Every change must be
  justifiable.
- Match engineering effort to the project's stage. This project is an early prototype: favor
  simple, working code over production hardening, except for data integrity in points versions.
- Keep changes as narrow as the request. If you find tangential issues (e.g. code that breaks
  conventions), list them in your summary and offer to add TODO comments at those spots.
- Before calling work done, run the verification commands above on the files you changed and
  resolve every issue they report.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for code style.

## Permissions

### Allowed without asking

- Reading files and listing directories
- Linting, type-checking, and formatting specific files
- Running unit tests on specific files

### Ask first

- Installing, removing, or upgrading packages (npm or Go modules)
- Any git operation that changes history or remotes (`commit`, `push`, `checkout`, `rebase`, etc.)
- Deleting files that were not created during the current task
- Running a full build

### Never

- Modify `.env`, `node_modules/`, `client/dist/`, or committed database files
- Modify the legacy `server/` directory
