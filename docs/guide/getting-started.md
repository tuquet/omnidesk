# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- **Rust Toolchain**:
  - Do cấu hình Tauri/Cargo của dự án được build cứng cho target **GNU** (`x86_64-pc-windows-gnu` sử dụng `gcc` làm linker), các nhà phát triển trên hệ điều hành Windows cần cài đặt Rust GNU Toolchain và GCC thay vì MSVC (Visual Studio).
  - Cách cài đặt gọn nhẹ nhất trên Windows (không cần cài Visual Studio nặng ~10GB):
    1. Cài đặt **Scoop** (nếu chưa có).
    2. Chạy lệnh: `scoop install rustup-gnu mingw`
    3. Thêm target GNU (nếu chưa tự động thêm): `rustup target add x86_64-pc-windows-gnu`
  - Trên macOS/Linux: Cài đặt Rust toolchain tiêu chuẩn qua `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`.
- Platform-specific [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Installation

```bash
# 1. Clone repository
git clone https://github.com/tuquet/omnidesk.git
cd omnidesk

# 2. Tạo file môi trường cục bộ từ example
cp .env.example .env

# 3. Cài đặt các package dependencies
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
