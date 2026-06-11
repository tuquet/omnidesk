# Kill Bug Machine

A **Premium B2B Enterprise Platform** with an **App Marketplace**, built as a cross-platform monorepo powered by the TanStack Ecosystem and Supabase.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![TanStack](https://img.shields.io/badge/TanStack-Ecosystem-FF4154)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000?logo=shadcnui)

## What's Included

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, shadcn/ui (56+ components), TanStack Router, TanStack Store, TanStack Query, TanStack Form, TanStack Table
- **Backend**: Supabase (Auth, PostgreSQL + RLS, Storage, Edge Functions, Realtime)
- **Desktop**: Tauri v2 shell with Rust Axum companion API (keyring, updater, local SQLite)
- **App Marketplace**: Modular feature system — install/uninstall apps to customize your workspace
- **Monorepo**: Turborepo + pnpm workspaces with shared config, types, and UI packages
- **Tooling**: ESLint 9, Prettier, Husky, lint-staged, TypeScript 7 (tsgo), Vitest
- **i18n**: Vietnamese + English with i18next
- **Docs**: VitePress documentation site

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)
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
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
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

# Supabase local development
npx supabase start                 # Start local Supabase
npx supabase db diff               # Generate migration from schema changes
npx supabase db push               # Apply migrations
```

When the desktop app is running, the Axum companion API is available at `http://localhost:1421` with OpenAPI documentation at `/scalar`.

## VS Code Integration

This project includes pre-configured VS Code tasks and launch configs. Press `F1` → `Run Task` to see all available options, or use `Ctrl+Shift+B` to build.

Recommended extensions will be suggested automatically when you open the project.

## Project Structure

```
├── apps/
│   ├── desktop/           # Tauri v2 desktop shell (Rust Axum companion)
│   └── web/               # React 19 + Vite 6 frontend
│       └── src/
│           ├── features/  # Feature modules (auth, dashboard, launcher, ...)
│           ├── config/    # App config, navigation, RBAC, routes
│           ├── lib/       # Supabase client, API client, i18n
│           ├── stores/    # Global TanStack Stores (dev, console)
│           └── routes/    # TanStack Router file-based routes
├── packages/
│   ├── config/            # Shared ESLint, TypeScript, Prettier configs
│   ├── types/             # Shared TypeScript types & Zod schemas
│   └── ui/                # shadcn/ui components (56+ components)
├── supabase/              # Supabase project (migrations, functions, config)
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

| Layer | Technology |
|:------|:-----------|
| Desktop Shell | Tauri v2 |
| Backend (Primary) | Supabase (Auth, PostgreSQL, Storage, Edge Functions) |
| Backend (Desktop) | Rust Axum (keyring, updater, local SQLite) |
| Frontend | React 19, Vite 6 |
| UI Components | shadcn/ui, Radix UI |
| Styling | Tailwind CSS v4 |
| State Management | TanStack Store, TanStack Query |
| Routing | TanStack Router (file-based) |
| Forms | TanStack Form + Zod |
| Tables | TanStack Table + TanStack Virtual |
| Monorepo | Turborepo, pnpm workspaces |
| API Docs | OpenAPI (utoipa) + Scalar |
| i18n | i18next (vi, en) |
| Testing | Vitest + Testing Library |
| Docs Site | VitePress |

## App Marketplace

The platform includes a modular **App Marketplace** where each feature is a standalone app:

- **Core Apps** (always installed): Dashboard, Team
- **Optional Apps**: Analytics, Projects, Lifecycle, Documents, UI Showcase, Error Pages Simulator
- Users can install/uninstall apps to customize their workspace
- Sidebar navigation dynamically updates based on installed apps

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

### ❌ Supabase connection failed

**Nguyên nhân:** Missing or incorrect `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env`.

**Fix:**
1. Copy `.env.example` to `.env`
2. Get your keys from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## License

[MIT](./LICENSE)
