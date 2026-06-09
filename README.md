# 🐛 Kill Bug Machine

> **Cross-platform Desktop DevTool** — Crawl, manage, và expose bugs qua MCP cho AI agents tự động xử lý.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-7_beta-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-06b6d4?logo=tailwindcss)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites (No Admin Required)](#-prerequisites-no-admin-required)
- [Installation](#-installation)
- [Development](#-development)
- [Building & Installing](#-building--installing)
- [VS Code Setup](#-vs-code-setup)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Scripts Reference](#-scripts-reference)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- 🔍 **Bug Crawler** — Crawl issues từ GitHub, Jira, GitLab, hoặc bất kỳ website nào via Playwright
- 📋 **Issue Manager** — Xem, thêm, sửa, xóa issues với full-text search
- 🤖 **MCP Server** — Expose bugs cho AI agents (Claude, Copilot...) qua Model Context Protocol
- 🔐 **Encrypted Storage** — SQLite encrypted + OS Keyring cho credentials
- 🎨 **Premium UI** — Shadcn/ui + Radix + Tailwind CSS 4 dark theme
- ⚡ **TypeScript 7** — Native compiler (tsgo) cho type-checking cực nhanh

---

## 🏗️ Architecture

```
kill-bug-machine/
├── apps/
│   ├── desktop/          # Tauri v2 desktop shell (Rust backend)
│   └── web/              # React + Vite frontend
├── packages/
│   ├── config/           # Shared ESLint, TypeScript, Prettier configs
│   ├── types/            # Shared TypeScript types + Zod schemas
│   ├── ui/               # Shadcn/Radix component library
│   ├── core/             # Business logic (Zustand + TanStack Query)
│   ├── crawler/          # Playwright-based bug crawler engine
│   └── mcp-server/       # MCP server for AI agent integration
└── docs/                 # Implementation plan, skill references
```

| Package | Role |
|:---|:---|
| `@kbm/web` | React 19 + Vite 6 + Tailwind CSS 4 frontend |
| `@kbm/desktop` | Tauri v2 desktop shell (Rust backend + SQLite) |
| `@kbm/ui` | Shadcn/Radix UI component library |
| `@kbm/types` | Shared TypeScript types + Zod runtime validation |
| `@kbm/config` | ESLint 9 strict + TypeScript strict + Prettier |
| `@kbm/core` | Business logic — stores, hooks, services |
| `@kbm/crawler` | Playwright-based bug crawler (plugin system) |
| `@kbm/mcp-server` | MCP server exposing bugs to AI agents |

---

## 🛠️ Prerequisites

Bạn có thể cài đặt môi trường bằng hai cách tùy thuộc vào việc bạn có quyền Administrator (UAC) hay không.

### 🛡️ Cách 1: KHÔNG có quyền Admin (Khuyên dùng)
> Sử dụng [Scoop](https://scoop.sh) và MinGW (GNU target) để cài đặt mọi thứ vào User Profile.

<details>
<summary><b>👉 Click để xem hướng dẫn cài đặt Không Admin</b></summary>

#### Bước 1: Cài Scoop (nếu chưa có)

Mở PowerShell (user bình thường, KHÔNG cần admin):

```powershell
# Cho phép chạy remote scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Cài Scoop
irm get.scoop.sh | iex
```

#### Bước 2: Cài Node.js + pnpm

```powershell
scoop install nodejs-lts
corepack enable
corepack prepare pnpm@latest --activate
```

#### Bước 3: Cài Rust + Cargo (GNU target)

```powershell
scoop install rustup

# Chọn GNU target khi setup: x86_64-pc-windows-gnu
rustup-init -y --default-toolchain stable --default-host x86_64-pc-windows-gnu

$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
```

#### Bước 4: Cài MinGW (GCC thay thế MSVC)

```powershell
scoop install mingw
```

#### Bước 5: Cấu hình Rust dùng GNU target

```powershell
rustup target add x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu

# Tạo file config cho Cargo để dùng GCC
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cargo" | Out-Null
@"
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"

[build]
target = "x86_64-pc-windows-gnu"
"@ | Set-Content "$env:USERPROFILE\.cargo\config.toml"
```

#### Bước 6: Cài Git

```powershell
scoop install git
git config --global core.autocrlf true
```

</details>

### 🔑 Cách 2: CÓ quyền Admin
> Sử dụng Winget và Visual Studio Build Tools (MSVC target) - tiêu chuẩn của Microsoft.

<details>
<summary><b>👉 Click để xem hướng dẫn cài đặt Có Admin</b></summary>

#### Bước 1: Cài Node.js + pnpm

Mở PowerShell:
```powershell
winget install OpenJS.NodeJS.LTS
corepack enable
corepack prepare pnpm@latest --activate
```

#### Bước 2: Cài Visual Studio Build Tools

**QUAN TRỌNG:** Mở PowerShell **Run as Administrator** để chạy lệnh này:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```
*(Quá trình này tải khoảng 2GB và mất 5-10 phút)*

#### Bước 3: Cài Rust (MSVC target)

```powershell
winget install Rustlang.Rustup

# Chọn MSVC target khi setup: x86_64-pc-windows-msvc
rustup-init -y --default-toolchain stable --default-host x86_64-pc-windows-msvc
```

#### Bước 4: Cài Git

```powershell
winget install Git.Git
git config --global core.autocrlf true
```

</details>

---

### ✅ Kiểm tra môi trường chung

Sau khi cài đặt bằng 1 trong 2 cách trên, chạy script sau để kiểm tra:

```powershell
Write-Host "=== Kill Bug Machine — Prerequisites Check ==="
Write-Host ""

$node = node --version 2>$null
Write-Host "Node.js:    $node $(if ($node) {'✅'} else {'❌'})"

$pnpm = pnpm --version 2>$null
Write-Host "pnpm:       $pnpm $(if ($pnpm) {'✅'} else {'❌'})"

$rustc = rustc --version 2>$null
Write-Host "Rust:       $rustc $(if ($rustc) {'✅'} else {'❌'})"

$git = git --version 2>$null
Write-Host "Git:        $git $(if ($git) {'✅'} else {'❌'})"

$target = rustup default 2>$null
Write-Host "Rust target: $target $(if ($target) {'✅'} else {'❌'})"

Write-Host ""
Write-Host "=== All checks passed? You're ready! ==="
```

---

## 📥 Installation

### Clone & Setup

```powershell
# Clone repository
git clone git@github.com:tuquet/kill-bug-machine.git
cd kill-bug-machine

# Cài dependencies (tất cả workspace packages)
pnpm install
```

### Verify Installation

```powershell
# Frontend build test
pnpm --filter @kbm/web build

# Rust compile test
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml

# Nếu cả 2 pass → bạn đã sẵn sàng! 🎉
```

---

## 💻 Development

### Chạy Frontend Dev Server

```powershell
# Chỉ frontend (React + Vite)
pnpm --filter @kbm/web dev
# → http://localhost:1420

# Hoặc qua Turbo (tất cả workspaces)
pnpm dev
```

### Chạy Tauri Desktop App (Dev Mode)

```powershell
# Full stack: frontend + Tauri desktop
pnpm --filter @kbm/desktop tauri dev

# Lần đầu sẽ compile Rust (~2-5 phút), sau đó hot-reload
```

### Type Checking

```powershell
# TypeScript 7 native (NHANH — dùng tsgo, compiler viết bằng Go)
pnpm typecheck:native

# TypeScript 6 standard (tsc)
pnpm typecheck
```

### Linting & Formatting

```powershell
# Lint tất cả
pnpm lint

# Format tất cả
pnpm format

# Kiểm tra format (CI)
pnpm format:check
```

### Rust Development

```powershell
# Check Rust code
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml

# Run Rust tests
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml

# Clippy (Rust linter)
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml -- -W clippy::all
```

---

## 📦 Building & Installing

### Build Frontend Only

```powershell
pnpm --filter @kbm/web build
# Output: apps/web/dist/
```

### Build Desktop App (Installable)

```powershell
# Build Tauri app → .exe + .msi installer
pnpm --filter @kbm/desktop tauri build

# Output:
# apps/desktop/src-tauri/target/release/kill-bug-machine.exe    (portable)
# apps/desktop/src-tauri/target/release/bundle/msi/             (.msi installer)
# apps/desktop/src-tauri/target/release/bundle/nsis/            (.exe installer)
```

### Build All (Turbo)

```powershell
pnpm build
```

### Cài đặt App

Sau khi build xong:

1. **Portable**: Chạy trực tiếp `kill-bug-machine.exe` từ `target/release/`
2. **Installer**: Chạy file `.msi` hoặc `.exe` trong `target/release/bundle/`
3. App sẽ xuất hiện trong Start Menu với icon KBM

---

## 🔧 VS Code Setup

### Cài Extensions (Recommended)

Khi mở project, VS Code sẽ gợi ý cài extensions. Hoặc cài thủ công:

```powershell
code --install-extension ms-vscode.vscode-typescript-native-preview  # TS7
code --install-extension dbaeumer.vscode-eslint                       # ESLint
code --install-extension esbenp.prettier-vscode                       # Prettier
code --install-extension bradlc.vscode-tailwindcss                    # Tailwind
code --install-extension rust-lang.rust-analyzer                      # Rust
code --install-extension tauri-apps.tauri-vscode                      # Tauri
code --install-extension vadimcn.vscode-lldb                          # Rust debugger
```

### VS Code Tasks (Ctrl+Shift+P → "Run Task")

| Task | Shortcut | Description |
|:---|:---|:---|
| 🌐 Dev: Web (Vite) | — | Start frontend dev server |
| 🖥️ Dev: Desktop (Tauri) | — | Start full Tauri app |
| ⚡ TypeCheck: Native (tsgo) | — | Type-check với TS7 (nhanh!) |
| 🔍 TypeCheck: Standard (tsc) | — | Type-check với tsc |
| 🧹 Lint: All | — | ESLint toàn bộ workspace |
| ✨ Format: All | — | Prettier format |
| 📦 Build: All (Turbo) | Ctrl+Shift+B | Build toàn bộ |
| 📦 Build: Desktop (Tauri) | — | Build app installer |
| 🧪 Test: All | — | Run tests |
| 🦀 Rust: Check | — | cargo check |
| 🦀 Rust: Clippy | — | Rust linter |
| 🦀 Rust: Test | — | cargo test |

### VS Code Debug (F5)

| Config | Description |
|:---|:---|
| 🖥️ Tauri: Dev (Full Stack) | Debug Tauri desktop app |
| 🌐 Web: Dev Server | Debug React frontend |
| 🦀 Rust: Debug Tauri | Debug Rust backend (LLDB) |
| 🌍 Chrome: Debug Web | Debug in Chrome browser |
| 🤖 MCP: Debug Server | Debug MCP server |
| 🚀 Full Stack (Compound) | Debug Web + Tauri cùng lúc |

---

## 📁 Project Structure

```
kill-bug-machine/
│
├── .vscode/                    # VS Code workspace configs
│   ├── tasks.json              # 18 build/dev tasks
│   ├── launch.json             # 6 debug configurations
│   ├── settings.json           # Editor settings (TS7 tsgo enabled)
│   └── extensions.json         # Recommended extensions
│
├── apps/
│   ├── desktop/                # Tauri v2 Desktop App
│   │   ├── package.json        # @kbm/desktop
│   │   └── src-tauri/
│   │       ├── Cargo.toml      # Rust dependencies
│   │       ├── tauri.conf.json # Tauri config (window, security, bundle)
│   │       ├── capabilities/   # Permission capabilities
│   │       ├── icons/          # App icons (all platforms)
│   │       └── src/
│   │           ├── main.rs     # Rust entry point
│   │           ├── lib.rs      # Plugin registration + command handler
│   │           ├── commands/   # Tauri IPC commands
│   │           │   ├── mod.rs
│   │           │   └── issues.rs   # CRUD commands
│   │           └── db/         # SQLite database
│   │               ├── mod.rs
│   │               └── connection.rs   # Schema + migrations
│   │
│   └── web/                    # React Frontend
│       ├── package.json        # @kbm/web
│       ├── tsconfig.json       # TypeScript config
│       ├── vite.config.ts      # Vite + Tailwind CSS 4
│       ├── index.html          # Entry HTML (Inter + JetBrains Mono fonts)
│       └── src/
│           ├── main.tsx        # React root
│           ├── App.tsx         # QueryClient + Router providers
│           ├── app/
│           │   ├── globals.css     # Tailwind @theme (design tokens)
│           │   ├── query-client.ts # TanStack Query config
│           │   └── router.tsx      # Lazy-loaded routes
│           └── features/       # Feature-based architecture
│               ├── dashboard/
│               ├── issues/
│               ├── crawler/
│               ├── mcp/
│               └── settings/
│
├── packages/
│   ├── config/                 # @kbm/config — Shared Configs
│   │   ├── eslint/index.mjs    # ESLint 9 flat config (strict, no-any)
│   │   ├── prettier/index.mjs  # Prettier config
│   │   └── tsconfig/
│   │       ├── base.json       # Strict TS base
│   │       ├── react.json      # React JSX config
│   │       └── node.json       # Node.js config
│   │
│   ├── types/                  # @kbm/types — Shared Types
│   │   └── src/
│   │       ├── enums/          # BugSource, IssueSeverity, IssueStatus, IssueType
│   │       ├── interfaces/     # BugIssue, CrawlConfig, McpServerConfig...
│   │       └── schemas/        # Zod schemas for runtime validation
│   │
│   └── ui/                     # @kbm/ui — Component Library
│       └── src/
│           ├── lib/utils.ts    # cn() utility (clsx + tailwind-merge)
│           └── components/
│               └── primitives/ # Button, Badge, Card, Input, Separator
│
├── docs/
│   ├── implementation_plan.md  # Full architecture plan
│   ├── skills-frontend.md      # Frontend skill reference
│   └── skills-backend.md       # Backend skill reference
│
├── package.json                # Root workspace (Turbo scripts)
├── pnpm-workspace.yaml         # Workspace packages
├── turbo.json                  # Turborepo pipeline
├── .prettierrc                 # Prettier config
├── .editorconfig               # Editor config
└── .gitignore                  # Git ignore rules
```

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|:---|:---|:---|
| **Desktop Shell** | Tauri | v2 |
| **Backend** | Rust | stable (GNU) |
| **Frontend** | React | 19 |
| **Build Tool** | Vite | 6 |
| **Styling** | Tailwind CSS | 4.0 |
| **UI Components** | Shadcn/ui + Radix | latest |
| **Type System** | TypeScript | 6 + 7 beta (tsgo) |
| **Validation** | Zod | 3.24+ |
| **Client State** | Zustand | 5 |
| **Server State** | TanStack Query | 5 |
| **Forms** | React Hook Form + Zod | 7 |
| **Database** | SQLite (rusqlite) | bundled |
| **Crawler** | Playwright | latest |
| **AI Protocol** | MCP SDK | latest |
| **Monorepo** | pnpm + Turborepo | 9 + 2 |
| **Linting** | ESLint 9 (flat config) | strict |
| **Formatting** | Prettier | 3 |

---

## 📜 Scripts Reference

### Root (`package.json`)

| Script | Command | Description |
|:---|:---|:---|
| `pnpm dev` | `turbo run dev` | Start all dev servers |
| `pnpm build` | `turbo run build` | Build all packages |
| `pnpm lint` | `turbo run lint` | Lint all packages |
| `pnpm typecheck` | `turbo run typecheck` | Type-check (tsc) |
| `pnpm typecheck:native` | `tsgo --noEmit` | Type-check (TS7 native) |
| `pnpm test` | `turbo run test` | Run all tests |
| `pnpm format` | `prettier --write` | Format all files |
| `pnpm format:check` | `prettier --check` | Check formatting (CI) |
| `pnpm clean` | `turbo run clean` | Clean build artifacts |

### Web App (`apps/web`)

| Script | Command |
|:---|:---|
| `pnpm --filter @kbm/web dev` | Start Vite dev server (port 1420) |
| `pnpm --filter @kbm/web build` | Production build |
| `pnpm --filter @kbm/web preview` | Preview production build |

### Desktop App (`apps/desktop`)

| Script | Command |
|:---|:---|
| `pnpm --filter @kbm/desktop tauri dev` | Dev mode (hot-reload) |
| `pnpm --filter @kbm/desktop tauri build` | Build installer (.exe/.msi) |

---

## 🔥 Troubleshooting

### ❌ `link.exe not found` (Rust compile error)

**Nguyên nhân:** Rust đang dùng MSVC target nhưng chưa cài Visual Studio Build Tools.

**Fix (không cần admin):**
```powershell
scoop install mingw
rustup default stable-x86_64-pc-windows-gnu
rustup target add x86_64-pc-windows-gnu
```

### ❌ `failed to resolve extends "@kbm/config/tsconfig/..."` (Vite)

**Nguyên nhân:** Vite's TSConfck parser không resolve được package exports cho tsconfig.

**Fix:** Dùng relative path trong tsconfig.json:
```json
{
  "extends": "../../packages/config/tsconfig/react.json"
}
```

### ❌ `tsc -b` fails with rootDir error

**Nguyên nhân:** Project references + composite mode conflict trong monorepo.

**Fix:** Dùng `vite build` directly (không cần `tsc -b`):
```json
{
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

### ❌ pnpm install fails

```powershell
# Clear cache
pnpm store prune

# Remove lockfile và reinstall
Remove-Item pnpm-lock.yaml -Force
Remove-Item -Recurse node_modules -Force
pnpm install
```

### ❌ Tauri dev server port conflict

```powershell
# Kill process on port 1420
Get-Process -Id (Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart
pnpm --filter @kbm/web dev
```

### ❌ WebView2 not found

WebView2 Runtime thường đã có sẵn trên Windows 10/11. Nếu không:
```powershell
scoop install webview2-runtime
```

---

## 📄 License

MIT

---

<p align="center">
  Made with 🐛 by KBM Team
</p>
