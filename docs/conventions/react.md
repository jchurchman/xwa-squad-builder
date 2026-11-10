# React (client)

- Move component logic into custom hooks. The hook owns state and effects, and it calls pure
  helpers for any computation.
- Split a component when either is true:
  - you would label a section of its JSX with a comment;
  - it holds state or effects for two unrelated parts of the UI.
- Do not split out a piece that has one caller and no meaning on its own.
- Named exports. One component per file, file named after the component.
- Components used in more than one place go in `client/src/components/`.
- Read state through selectors in `client/src/state/selectors/`, not inline in components.
