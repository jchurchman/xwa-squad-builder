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
| `backend/` | Planned. New Go server. Does not exist yet.                                                          |
| `server/`  | Legacy Node/Express server. Frozen: do not modify or fix. Will be removed.                           |
| `shared/`  | TypeScript types shared by `client/` and the legacy `server/`. Will be replaced by the API contract. |
| `docs/`    | Architecture decisions and open questions for XWA.                                                   |

## Stack

- **Client:** React 19, TypeScript, Vite, antd 5, Redux Toolkit + RTK Query, react-router 7, SCSS
  modules.
- **Backend (planned):** Go, SQLite, Discord OAuth.
- **API (planned):** Connect RPC. Protobuf definitions generate both the Go server code and the
  TypeScript types the client uses.
- **Card definitions (planned):** a fork of
  [xwing-data2](https://github.com/xwingtmg/xwing-data2), keyed by [XWS](https://github.com/elistevens/xws-spec) IDs.

## Commands

```bash
npm i              # install all workspaces
npm run client:dev # client on http://localhost:5173, proxies /api to :3001
```

Verification for client changes:

```bash
npx eslint <files>   # lint specific files
npx tsc -b           # type-check, run from client/
npx prettier --check <files>
```

There is no test runner yet. Vitest is the intended choice for the client; adding it requires
approval (package install). Go commands will be added here when `backend/` exists.

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
