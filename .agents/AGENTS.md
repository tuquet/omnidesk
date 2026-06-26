# OmniDesk Agent Rules

## 1. Architectural Philosophy
- **Micro-App Isolation**: Apps and packages (`apps/`, `packages/`) MUST NOT import from each other directly. All inter-app communication must go through the Rust API Gateway or Event Bus.
- **Backend Supremacy**: The React frontend (`platform/web`) is purely a view layer. The Rust Backend (Tauri v2 + Axum gateway on port `1421`) is the ultimate authority for routing, file access, and DB operations.
- **Local-First, Cloud-Second**: All writes execute synchronously against local SQLite (via `SQLx`). Supabase acts strictly as a background asynchronous 2-way sync layer.
- **Zero-Trust Web Auth**: Never use internal WebViews for external OAuth. Always open the native system browser and capture the token via `omnidesk://` deep links.

## 2. Frontend & UI Engineering
- **Cross-Platform by Default**: Ensure all React code in `platform/web` works flawlessly across Desktop (Tauri) and Web browsers.
- **Graceful Fallbacks**: If utilizing native Tauri APIs (e.g., `fs`), always implement a Web equivalent (e.g., Browser File API) or provide a fallback UI for standard browsers.
- **Shadcn Blocks**: Always prioritize using `npx shadcn@latest add <block-name>` (e.g., `login-02`) before building custom UI features to ensure design consistency and responsive layouts.
- **Responsive Dimensions**: Never hardcode dimensions that break inside small Tauri windows or mobile browsers. Use responsive CSS/Tailwind utilities.

## 3. Tooling & Environment

### MemPalace MCP
- **Execution Environment**: Always run MemPalace globally using `uv` shims (`...\scoop\persist\uv\tools\shims\mempalace-mcp.exe`). Do NOT run from the local source repository.
- **Data Path**: The ChromaDB data (`chroma.sqlite3`) path must point to `...\OneDrive\Documents\MemPalace\palace`.

### Troubleshooting MemPalace
- **`exit status 0xffffffff`**: Delete legacy Scoop shims (`Remove-Item C:\Users\Admin\scoop\shims\mempalace* -Force`) and restart the IDE.
- **`Access is denied` (Folder operations)**: Terminate active MCP Python processes first (`Stop-Process -Name "mempalace-mcp" -Force`).
- **`Application Control policy blocked` (WDAC)**: Reinstall the tool via `uv tool install mempalace --force --reinstall` to bypass WDAC hash issues.
