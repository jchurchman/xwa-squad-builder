# XWA Squad Builder

Squad builder for the X-Wing Miniatures Game using X-Wing Alliance (XWA) points and rules, with
card definitions kept as JSON data and points kept in a versioned database.

## Read before you start

Read only the docs that match your task.

| If the task involves…                                 | Read                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `backend/`, `proto/`, card data, or points            | [docs/architecture.md](docs/architecture.md)                     |
| Which folders are active, frozen, or generated; stack | [docs/project-structure.md](docs/project-structure.md)           |
| Setup, card import, running, building                 | [docs/development.md](docs/development.md)                       |
| X-Wing terms (platform, pilot, ship, list, XWS ID)    | [docs/domain.md](docs/domain.md)                                 |
| Writing any code: principles and naming               | [docs/conventions/general.md](docs/conventions/general.md)       |
| TypeScript in `client/`                               | [docs/conventions/typescript.md](docs/conventions/typescript.md) |
| React components                                      | [docs/conventions/react.md](docs/conventions/react.md)           |
| SCSS                                                  | [docs/conventions/styling.md](docs/conventions/styling.md)       |
| Go in `backend/`                                      | [docs/conventions/go.md](docs/conventions/go.md)                 |
| Writing tests                                         | [docs/conventions/testing.md](docs/conventions/testing.md)       |
| Branches, commits, pull requests                      | [docs/conventions/git.md](docs/conventions/git.md)               |

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Commands

Run from the repository root:

```bash
npm run backend:import # load card data into backend/xwa.db; the server refuses to start without it
npm run dev            # Go backend on :3001, client on http://localhost:5173
npm run generate       # run after editing any .proto file
```

## Verification

Run after all edits are made. Fix what it reports and re-run until it is clean.

Client (from the repository root):

```bash
npx eslint <files>
(cd client && npx tsc --noEmit)   # never run plain `tsc -b`; it writes .js files into src/
npx prettier --check <files>
```

Backend (from `backend/`):

```bash
gofmt -l .               # must print nothing
golangci-lint run ./...  # includes go vet
go test ./...
```

## Never edit

- `server/`: the legacy Node server, frozen.
- `backend/gen/` and `client/src/gen/`: generated code. Change the `.proto` file and run
  `npm run generate`.
- `.env`, `node_modules/`, `client/dist/`, and `*.db` files.

## Permissions

- **Allowed without asking:** linting, type-checking, formatting, and running tests, including
  the full suites above.
- **Ask first:** installing, removing, or upgrading packages (npm or Go modules); any git
  operation that changes history or remotes (`commit`, `push`, `checkout`, `rebase`, etc.);
  deleting files not created during the current task; running a full build (`npm run build`).

## Working agreements

These apply to every task and are written to be portable to other projects.

- If you are not sure what I meant, stop and ask one question before editing, even partway
  through a queue of work. Then resume the queue.
- Before changing anything, list every file you will need and read them in one pass. Then make
  all edits, then run verification.
- Before writing "we do X" or "we don't have X" anywhere, reopen the code and cite `file:line`.
- Stop at each PR boundary and wait for my review before starting the next PR.
- Treat work as a queue. When I propose tweaks or corrections mid-task, append them to the queue
  instead of jumping to them. Stop only when the queue is empty.
- You Aren't Gonna Need It. Never expand scope without permission. Suggest scope improvements
  when they make sense, but do not act on them unasked. Every change must be justifiable.
- This project is an early prototype: favor simple, working code over production hardening,
  except for data integrity in points versions.
- Keep changes as narrow as the request. If you find tangential issues (e.g. code that breaks
  conventions), list them in your summary and offer to add TODO comments at those spots.
