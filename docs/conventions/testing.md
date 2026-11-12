# Testing

- **Client:** Vitest. `npm run client:test` runs every client test once; for chosen files use
  `(cd client && npx vitest run <test files>)`. Put tests in a `__tests__` folder beside the code
  under test.
- **Backend:** table-driven tests next to the code (`foo_test.go`).
- **Rule evaluation** will exist in both TypeScript and Go. Its test cases should live as shared
  JSON fixtures that both test suites run, so the two implementations cannot drift apart.
