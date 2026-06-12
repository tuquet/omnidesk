# Contributing

Thank you for your interest in contributing.

## Setup

```bash
git clone https://github.com/tuquet/omnidesk.git
cd omnidesk
pnpm install
pnpm dev
```

## Development

1. Create a branch from `main`.
2. Make your changes.
3. Verify everything works:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm --filter @omnidesk/web build
   cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.).
5. Open a Pull Request.

## Guidelines

- **UI**: Use shadcn/ui components and Tailwind CSS utilities. Use `cn()` for conditional class merging.
- **Rust**: Use `Result<T, E>` for error handling. Do not use `unwrap()` or `expect()` in application code.
- **CI**: All PRs must pass the CI pipeline (lint, typecheck, build, cargo check) before merging.
