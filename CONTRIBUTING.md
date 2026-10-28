# Contributing

## Workflow

- Branch off `main`. Name branches `<your initials>/<short-description>`, e.g.
  `jc/points-version-schema`.
- Keep commits focused and atomic, with clear messages.
- Keep pull requests to one logical change.
- Before opening a PR, run lint, type-check, and tests (see [AGENTS.md](AGENTS.md#commands)) on
  everything you changed.

## General principles

- Code should be easy to reason about. Prefer pure functions with descriptive names.
- Extract magic strings and magic numbers into named constants.
- Avoid nested ternaries.
- Colocate code with its only consumer. Move it to a shared location (`components/`, `hooks/`,
  `utils/`, `types/`) only once a second consumer needs it.
- Some existing code predates these conventions. Do not rewrite it as a side effect of other
  work; note it instead.

## Naming

- Types, interfaces, and components: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`, including the keys of enum-like objects
- Function prefixes:
  - `get…` reads a value from an object or payload, e.g. `getPilotCost`
  - `aToB` transforms one shape into another, e.g. `pilotToSelectOption`
  - `make…` is a factory that returns a function or configured instance
  - `create…` builds a new object, e.g. initial state or merged arguments
  - `select…` is a Redux selector

## TypeScript (client)

- No `any`. Use `unknown` when a type is genuinely uncertain.
- Interfaces for object shapes; `type` aliases for unions, intersections, and utility types.
- Avoid non-null assertions (`!`) unless surrounding logic guarantees the value.
- Do not use TS `enum` or string-literal unions for fixed sets. Use a `const` object plus a
  `ValueOf` type:

  ```ts
  export const POINTS_VERSION_STATUS = {
    DRAFT: 'draft',
    TESTING: 'testing',
    PUBLISHED: 'published',
  } as const;

  export type PointsVersionStatus = ValueOf<typeof POINTS_VERSION_STATUS>;
  ```

- Types used by more than one module live in `client/src/types/`.
- Prefer path aliases over long relative imports. Aliases are defined in
  [client/vite.config.ts](client/vite.config.ts) (`@components`, `@hooks`, `@selectors`,
  `@types`, `@api`, `@assets`, `src`). Keep the ESLint import-sort groups in
  [eslint.config.mjs](eslint.config.mjs) in step when aliases change.

## React (client)

- Function components with hooks only.
- Small components with one responsibility; move logic into custom hooks.
- Named exports. One component per file, file named after the component.
- Components used in more than one place go in `client/src/components/`.
- Read state through selectors in `client/src/state/selectors/`, not inline in components.

## Styling (client)

- One SCSS module per component, named to match it: `ShipForm.tsx` → `ShipForm.module.scss`.
- Class names in kebab-case, following `component-element-role`, e.g. `ship-form-pilot-select`.
  Vite exposes them in camelCase (`classes.shipFormPilotSelect`).
- Shared colors and sizes come from [client/src/variables.scss](client/src/variables.scss).
- No inline `style` props.

## Go (backend)

The Go backend does not exist yet. Until conventions are written here, follow standard Go
practice: `gofmt`, `go vet`, idiomatic error handling, small packages named for what they
provide, and table-driven tests next to the code (`foo_test.go`).

## Tests

- Client: no runner is installed yet. Vitest is the intended choice. Put tests in a `__tests__`
  folder beside the code under test.
- Rule evaluation will exist in both TypeScript and Go. Its test cases should live as shared JSON
  fixtures that both test suites run, so the two implementations cannot drift apart.

## Repository layout

```text
client/              React app
  src/
    api/             fetch helpers
    assets/          fonts and images
    components/      UI components (shared ones at top level, others nested by feature)
    hooks/           custom hooks used by more than one component
    state/           Redux store
      slices/        state slices and the RTK Query API slice
      selectors/     selectors and upgrade restriction logic
    types/           client-side TypeScript types
backend/             Go server (planned)
server/              legacy Node server (frozen, to be removed)
shared/              TS types shared with the legacy server (to be replaced)
docs/                architecture decisions, open questions
```
