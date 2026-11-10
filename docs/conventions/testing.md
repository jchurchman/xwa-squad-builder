# Testing

- **Client:** no test runner is installed yet. Vitest is the intended choice; adding it requires
  approval (package install). Put tests in a `__tests__` folder beside the code under test.
- **Backend:** table-driven tests next to the code (`foo_test.go`).
- **Rule evaluation** will exist in both TypeScript and Go. Its test cases should live as shared
  JSON fixtures that both test suites run, so the two implementations cannot drift apart.
