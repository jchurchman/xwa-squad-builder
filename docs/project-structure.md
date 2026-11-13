# Project structure

## Status

| Path       | State                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `client/`  | Active. React app; kept through the rewrite.                                                       |
| `backend/` | Active. Go server and card import. Serves ships, pilots, and upgrades; points are not built yet.   |
| `proto/`   | Active. Connect RPC API definitions. Generated code lives in `backend/gen/` and `client/src/gen/`. |
| `docs/`    | Architecture decisions and open questions for XWA.                                                 |

## Stack

- **Client:** React, TypeScript, Vite, antd, Redux Toolkit + RTK Query, react-router, SCSS
  modules.
- **Backend:** Go, SQLite (pure-Go `modernc.org/sqlite` driver). Discord OAuth is planned.
- **API:** Connect RPC (connect-go v2, connect-web). Protobuf definitions in `proto/` generate both
  the Go server code and the TypeScript types the client uses.
- **Card definitions:** the [jchurchman/xwing-data2](https://github.com/jchurchman/xwing-data2) fork,
  keyed by [XWS](https://github.com/elistevens/xws-spec) IDs. `backend/cards.version` pins the
  commit to import.

## Layout

```text
client/              React app
  src/
    api/             Connect client for the backend
    assets/          fonts and images
    components/      UI components (shared ones at top level, others nested by feature)
    gen/             generated from proto/; do not edit
    hooks/           custom hooks used by more than one component
    state/           Redux store
      slices/        state slices and the RTK Query API slice
      selectors/     selectors
    types/           client-side TypeScript types
backend/             Go server
  cards.version      pinned commit of the card data fork
  cmd/server/        API server
  cmd/importcards/   card data import
  gen/               generated from proto/; do not edit
  internal/          carddata (read the fork), store (SQLite), cardservice (API handlers)
proto/               Connect RPC API definitions (buf.yaml, buf.gen.yaml at the repo root)
docs/                architecture decisions, open questions, conventions
```
