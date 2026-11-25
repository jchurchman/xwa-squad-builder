# Client

React app for the XWA Squad Builder: React, TypeScript, Vite, antd, Redux Toolkit + RTK Query,
SCSS modules. It reads cards and points from the Go backend over Connect RPC; the Vite dev server
proxies `/api` to the backend on port 3001.

This folder owns the repository's JavaScript tooling: the npm packages and the ESLint
(`eslint.config.js`), Prettier (`.prettierrc`), and TypeScript (`tsconfig.json`) configs. The root
[Makefile](../Makefile) runs them; Prettier also formats the docs at the repository root.

- Setup and commands: [docs/development.md](../docs/development.md)
- Folder layout: [docs/project-structure.md](../docs/project-structure.md)
- Terms such as platform, pilot, ship, and list: [docs/domain.md](../docs/domain.md)
- Code conventions: [TypeScript](../docs/conventions/typescript.md),
  [React](../docs/conventions/react.md), [styling](../docs/conventions/styling.md)
