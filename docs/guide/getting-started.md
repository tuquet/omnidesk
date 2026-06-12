# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [Rust](https://rustup.rs/) stable toolchain
- Platform-specific [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Installation

```bash
git clone https://github.com/tuquet/omnidesk.git
cd omnidesk
cp .env.example .env
pnpm install
```

## Running the Dev Server

```bash
# Start web frontend + VitePress docs simultaneously
pnpm dev:all
```

This starts:

| Service      | URL                     |
| :----------- | :---------------------- |
| Web Frontend | `http://localhost:1420` |
| Docs         | `http://localhost:5173` |

To also run the Tauri desktop app (which includes the Axum backend):

```bash
pnpm --filter @omnidesk/desktop tauri dev
```

The Axum API server runs at `http://localhost:8080`. OpenAPI documentation is available at `/scalar`.

## VS Code

Press `F1` → `Run Task` to access pre-configured tasks for building, linting, and running dev servers. Recommended extensions are suggested automatically.

## Building for Production

```bash
pnpm --filter @omnidesk/desktop tauri build
```

This produces platform-specific installers in `apps/desktop/src-tauri/target/release/bundle/`.
