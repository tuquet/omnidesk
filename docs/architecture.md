# OmniDesk Architecture

OmniDesk is engineered as a **Local-First Enterprise OS**. This document outlines the core architectural boundaries and data flow of the application.

## 1. The Kernel (Launcher) vs The Userland (Apps)

Think of OmniDesk as an operating system:

- **Launcher (Kernel):** The Tauri desktop window. It manages local SQLite, the Axum HTTP Gateway (port 1421), system tray, deep links (`omnidesk://` or `omnidesk://`), and authentication tokens.
- **Apps (Userland):** Features like "Marketplace", "Settings", or "Code Tools". They run inside the Launcher's React context but are isolated in their own folders. They do not share global state arbitrarily. They only communicate by querying the Axum API Gateway.

## 2. Dual-Interface API Gateway

OmniDesk utilizes a powerful Rust backend that serves two interfaces simultaneously:

1. **Tauri IPC (`invoke`):** Fast, native communication used exclusively by the Desktop Launcher UI for critical OS-level tasks.
2. **Axum HTTP (`localhost:1421/api`):** A standard REST API Gateway used by all "Apps" within OmniDesk to fetch data, sync to the cloud, or trigger local installations.

### Why Axum?

By running a local web server inside the Desktop App, we decouple the React frontend from Tauri's proprietary IPC for standard business logic. This allows us to easily port the UI to the Web (BaaS) or build headless CLI tools (`omnidesk-cli`) that hit the same local endpoints.

## 3. Data Synchronization: Local-First & 2-Way Sync

We strictly avoid the standard "Frontend -> Cloud DB" pattern for business logic.

**The OmniDesk Data Flow:**

1. User clicks an action (e.g., Install App).
2. Frontend sends an HTTP Request to the local Axum Server (`POST /api/apps/install`).
3. Rust Backend validates the token and writes the change to the **Local SQLite Database (`omnidesk.db`)** immediately.
4. Rust Backend asynchronously sends an HTTP request to **Supabase (Cloud)** to synchronize the state.
5. If the cloud fails, the local state remains intact, allowing full offline capability.

## 4. UI / State Management Rules

- **No Zustand for Business Data:** Global state (Zustand) is strictly limited to UI elements (Theme, Sidebar open/close).
- **TanStack Query is the Source of Truth:** All data fetched from the API Gateway must be cached and managed by TanStack Query.
- **Optimistic Updates:** UI should predict the success of mutations (e.g., toggling an install button) before the Rust backend confirms it, ensuring a 0ms latency feel.

## 5. Enterprise Security & Auth Flow

- **Zero-Trust WebViews:** OmniDesk will never open an external login page (like Google or GitHub OAuth) inside a Tauri WebView. WebViews can be compromised to steal keystrokes or cookies.
- **System Browser Deep Linking:** Authentication requests invoke the OS Default Browser. Once the user authenticates on the web, Supabase redirects to `omnidesk://auth/callback`. The Tauri OS-level hook catches the deep link and securely hands the JWT payload back to the Rust Kernel.
