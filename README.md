# KBM Boilerplate

A production-ready monorepo boilerplate for building cross-platform desktop applications with **Tauri v2**, **React 19**, **Rust Axum**, and **shadcn/ui**.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Rust](https://img.shields.io/badge/Rust-Axum-black?logo=rust)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000?logo=shadcnui)

## What's Included

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, shadcn/ui (all components), React Router, Zustand, TanStack Query
- **Backend**: Tauri v2 shell with Rust Axum HTTP server, SQLite (sqlx), OpenAPI docs via Scalar
- **Monorepo**: Turborepo + pnpm workspaces with shared config, types, and UI packages
- **Tooling**: ESLint 9, Prettier, Husky, lint-staged, GitHub Actions CI
- **Docs**: VitePress documentation site

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- **Rust Toolchain**: Không yêu cầu cài đặt sẵn, dự án sử dụng GNU Toolchain qua `scoop` để tránh việc phải tải Visual Studio Build Tools nặng nề.
- Platform-specific Tauri [prerequisites](https://v2.tauri.app/start/prerequisites/)

## Environment Setup (Windows)

Để bắt đầu, bạn cần cài đặt môi trường Rust GNU. Bạn không cần quyền Admin hay cài Visual Studio cồng kềnh.

1. **Cài đặt Scoop** (nếu chưa có):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

2. **Cài đặt Node.js, pnpm, MinGW & Rustup**:
```powershell
scoop install nodejs pnpm mingw rustup
```

3. **Cấu hình Rust sang target GNU**:
```powershell
rustup default stable-x86_64-pc-windows-gnu
rustup target add x86_64-pc-windows-gnu
```

4. **Kiểm tra môi trường**:
```powershell
node -v
pnpm -v
rustc --version
```

## Getting Started

```bash
git clone https://github.com/tuquet/kill-bug-machine.git
cd kill-bug-machine
cp .env.example .env
pnpm install
```

## Development

```bash
# Start everything (web + desktop + docs)
pnpm dev:all

# Or individually
pnpm --filter @kbm/web dev        # Web frontend → http://localhost:1420
pnpm --filter @kbm/desktop tauri dev  # Tauri desktop app
pnpm docs:dev                      # VitePress docs → http://localhost:5173
```

When the desktop app is running, the Axum API server is available at `http://localhost:8080` with OpenAPI documentation at `/scalar`.

## VS Code Integration

This project includes pre-configured VS Code tasks and launch configs. Press `F1` → `Run Task` to see all available options, or use `Ctrl+Shift+B` to build.

Recommended extensions will be suggested automatically when you open the project.

## Project Structure

```
├── apps/
│   ├── desktop/           # Tauri v2 desktop shell (Rust Axum backend)
│   └── web/               # React 19 + Vite 6 frontend
├── packages/
│   ├── config/            # Shared ESLint, TypeScript, Prettier configs
│   ├── types/             # Shared TypeScript types
│   └── ui/                # shadcn/ui components (56 components)
├── docs/                  # VitePress documentation
├── .github/workflows/     # CI pipeline
└── .vscode/               # Tasks, launch configs, extensions
```

## Build

```bash
pnpm build                             # Build all packages
pnpm --filter @kbm/desktop tauri build  # Build desktop installer (.exe/.msi)
```

## Tech Stack

| Layer            | Technology                |
| :--------------- | :------------------------ |
| Desktop Shell    | Tauri v2                  |
| Backend          | Rust, Axum, SQLite (sqlx) |
| Frontend         | React 19, Vite 6          |
| UI Components    | shadcn/ui, Radix UI       |
| Styling          | Tailwind CSS v4           |
| State Management | Zustand, TanStack Query   |
| Monorepo         | Turborepo, pnpm           |
| API Docs         | OpenAPI (utoipa) + Scalar |
| Docs Site        | VitePress                 |

## 🔥 Troubleshooting

### ❌ Tauri dev server port conflict

**Nguyên nhân:** Cổng 1420 (Vite) đang bị kẹt bởi một process Node khác.

**Fix (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
```

### ❌ WebView2 not found

**Nguyên nhân:** Máy chưa có trình duyệt nhúng Edge WebView2 Runtime.

**Fix:**
```powershell
scoop install webview2-runtime
```

---

## License

[MIT](./LICENSE)
