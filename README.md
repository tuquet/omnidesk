<div align="center">
  <img src="https://raw.githubusercontent.com/tauri-apps/tauri/HEAD/app-icon.png" width="120" alt="OmniDesk Logo" />
  <h1>OmniDesk</h1>
  <p><strong>The Local-First Enterprise OS & Developer Workspace</strong></p>
  <p><i>Formerly known as OmniDesk (OmniDesk)</i></p>
</div>

---

## 🌌 Vision: The Local-First Enterprise OS

OmniDesk is not just a standard application; it is a **Micro-OS (Operating System)** designed for enterprises and developers.

- **The Launcher (Kernel):** OmniDesk's core acts as the kernel. It is strictly responsible for Authentication, System Deep Links (`omnidesk://`), Database Connections (Local SQLite), Background Services (Axum API Gateway), and Window Management.
- **The Apps (Userland):** Everything else—including the App Marketplace, internal tools, and plugins—are independent "Apps". They live in isolation and communicate with the system exclusively through the internal Axum API Gateway.

## 🧠 Architecture Philosophy & Mindset

To ensure OmniDesk scales securely and efficiently, we adhere to 4 extreme architectural philosophies:

### 1. Micro-App / Feature Isolation

Each app within OmniDesk (e.g., App Store, Settings, specific tools) is strictly isolated. They reside in separate `features/` folders or standalone packages. Apps cannot directly import code from one another. All cross-app communication must route through the Launcher's Event Bus or API Gateway.

### 2. Local-First, Cloud-Second

OmniDesk is built for **0ms latency and full offline capability**.
When an action occurs (like installing an app), the data is immediately written to the local SQLite database. The Cloud (Supabase) acts only as a background synchronization layer (2-way sync), ensuring your workspace is backed up and available across devices.

### 3. Backend is the Real API Gateway

The React Frontend is just a view layer. **Absolute power belongs to the Rust Backend.**
File system access, network requests, app installations, and heavy lifting are handled by Rust and exposed via HTTP (`localhost:1421/api/...`). This decoupled design ensures we can build CLIs or alternative clients without touching the frontend.

### 4. Zero-Trust External Web

We adhere to strict Enterprise Security standards. **No internal WebViews are used for external content or authentication.**
OAuth and external login flows are routed to the user's default OS browser. Upon successful authentication, the system securely catches the payload via Deep Links (`omnidesk://` or `omnidesk://`).

---

## 🛠 Tech Stack

- **Core/Backend:** Rust 🦀, Tauri v2, Axum (HTTP API Gateway), SQLx (SQLite Local DB)
- **Frontend:** React 19, TypeScript, Vite, TanStack Query v5
- **UI/UX:** Tailwind CSS v4, Shadcn/ui (Strict Enterprise Aesthetics)
- **Cloud/Sync:** Supabase (PostgreSQL, Auth, Edge Functions)

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20 & `pnpm`
- **Rust toolchain (GNU target)**:
  - Do cấu hình cargo yêu cầu target `x86_64-pc-windows-gnu` và linker `gcc`, lập trình viên Windows nên cài đặt Rust GNU Toolchain cùng GCC (MinGW).
  - Cách cài đặt nhanh qua Scoop:
    ```powershell
    scoop install rustup-gnu mingw
    rustup target add x86_64-pc-windows-gnu
    ```
- Tauri CLI dependencies installed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tuquet/omnidesk.git
cd omnidesk

# 2. Cài đặt các file môi trường
cp .env.example .env

# 3. Install dependencies
pnpm install

# 4. Start the Local-First OS (Development)
pnpm --filter @omnidesk/desktop tauri dev
```

## 📖 Documentation

Detailed architectural guidelines and developer rules can be found in the `docs/` directory.
