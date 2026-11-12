# TypeScript (client)

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
- The `@/` alias maps to `client/src` (see [general.md](general.md) for import rules). It is
  defined in [client/vite.config.ts](../../client/vite.config.ts) and
  [client/tsconfig.json](../../client/tsconfig.json); `@shared` points at the legacy `shared/`
  types until they are replaced. Keep the ESLint import-sort groups in
  [eslint.config.mjs](../../eslint.config.mjs) in step when aliases change.
