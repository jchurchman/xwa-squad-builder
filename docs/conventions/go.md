# Go (backend)

- Keep packages small and named for what they provide.
- Entry points go in `backend/cmd/<name>/main.go`; everything else in `backend/internal/`.
- Name constants in Go's style (`camelCase` unexported, `PascalCase` exported), not
  `SCREAMING_SNAKE_CASE`.
- API handlers return `connect.NewError` with a safe public message, and log the underlying
  error instead of sending it to the client.
- Never expose database row IDs in the API; use XWS IDs.
