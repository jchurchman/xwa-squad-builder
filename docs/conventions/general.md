# General conventions

## Principles

- Prefer pure functions. A function is pure if any call to it could be replaced by its return
  value without changing what the program does.
- Do not mutate arguments or shared state; return new values. Exception: Redux Toolkit reducers
  in `client/src/state/slices/` may write to `state`, because Immer turns those writes into a
  new value.
- Keep side effects (I/O, dispatch, mutation) in a thin outer layer such as event handlers,
  hooks, and API calls. Do the computing in pure functions that take their inputs as arguments
  instead of reading module state.
- A function's name must describe everything it does. If describing it takes "and", split it.
- Extract magic strings and magic numbers into named constants.
- Client ESLint enforces `complexity` (max 10), `max-depth` (max 3), and `no-nested-ternary`.
  Fix a violation by extracting a named function or returning early, not by disabling the rule.
- Do not use index barrel files.
- Colocate code with its only consumer. Move it to a shared location (`components/`, `hooks/`,
  `types/`) only once a second consumer needs it.

## Naming

- Types, interfaces, and components: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`, including the keys of enum-like objects (Go differs; see
  [go.md](go.md))
- Function prefixes:
  - `get…` reads a value from an object or payload, e.g. `getPilotCost`
  - `aToB` transforms one shape into another, e.g. `pilotToSelectOption`
  - `make…` is a factory that returns a function or configured instance
  - `create…` builds a new object, e.g. initial state or merged arguments
  - `select…` is a Redux selector
- `get…` and `select…` functions only read. They never write, dispatch, or fetch.
