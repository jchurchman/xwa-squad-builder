# Task runner for the Go backend and the TypeScript client. Run targets from the repository root.
# JavaScript tooling (Prettier, ESLint, TypeScript) is installed in client/; `make install` sets it up.

# Prettier runs from client/ so it finds its plugins there; FILES stay relative to the root.
PRETTIER := cd client && node_modules/.bin/prettier --config .prettierrc
# Files that `make format` and `make format-check` act on. Override to check only what you changed:
#   make format-check FILES="docs/development.md client/src/App.tsx"
FILES ?= "**/*.{ts,tsx,json,md}"
PRETTIER_FILES = $(addprefix ../,$(FILES))

.PHONY: install dev backend-dev client-dev import generate test backend-test client-test \
	lint lint-fix format format-check build backend-build client-build start

install: ## install client packages and the git hooks in lefthook.yml
	cd client && npm install && npx lefthook install

dev: ## run the Go backend on :3001 and the client on http://localhost:5173
	$(MAKE) -j2 backend-dev client-dev

backend-dev:
	cd backend && go run ./cmd/server

client-dev:
	cd client && npm run dev

import: ## load the pinned card data and its AMG points into backend/xwa.db
	cd backend && go run ./cmd/importcards

generate: ## lint proto/ and regenerate Go and TypeScript code
	buf lint && buf generate

test: client-test backend-test ## client tests, then go vet and Go tests

client-test:
	cd client && npm test

backend-test:
	cd backend && go vet ./... && go test ./...

lint: ## lint the client
	cd client && npx eslint .

lint-fix:
	cd client && npx eslint . --fix

format: ## format FILES with the client's Prettier config
	$(PRETTIER) --write $(PRETTIER_FILES)

format-check:
	$(PRETTIER) --check $(PRETTIER_FILES)

build: client-build backend-build ## build client/dist and backend/bin/server

client-build:
	cd client && npm run build

backend-build:
	cd backend && go build -o bin/server ./cmd/server

start: ## run the built Go server (API only)
	cd backend && ./bin/server
