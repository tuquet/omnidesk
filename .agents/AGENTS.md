<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## UI Blocks & Features

When tasked with implementing a new UI feature, page, or function (e.g., login, signup, dashboard, settings):

- **Always consider Shadcn Blocks:** Use the command `npx shadcn@latest add <block-name>` (e.g., `login-02`, `signup-02`) to scaffold the UI quickly.
- Shadcn Blocks provide complete, responsive page layouts that follow the project's design system.

## OmniDesk Architecture Rules

When working on this workspace, strictly follow these core philosophies:

1. **Micro-App Isolation**: Each feature/app lives in isolation (e.g. under `apps/` or `packages/`). They must not import code directly from each other. Communication must go through the Rust API Gateway or Event Bus.
2. **Backend is the Real API Gateway**: The React frontend is just a view. Absolute power belongs to the Rust Backend (Tauri v2 + Axum gateway). Files, DB, and system integrations must route through HTTP `localhost:1421/api/...`.
3. **Local-First, Cloud-Second**: Actions must write immediately to local SQLite (via SQLx). Supabase acts only as a background 2-way sync layer.
4. **Zero-Trust Web**: No internal WebViews for external auth. OAuth flows must open the user's system browser and capture tokens via the `omnidesk://` deep link.

## MemPalace Tooling & Troubleshooting

1. **Global Installation**: MemPalace must be run globally via `uv` shims:
   - CLI: `C:\Users\Admin\scoop\persist\uv\tools\shims\mempalace.exe`
   - MCP: `C:\Users\Admin\scoop\persist\uv\tools\shims\mempalace-mcp.exe`
   - Do NOT run or install it from the local source git repository.
2. **Handling `exit status 0xffffffff`**:
   - If you see `exit status 0xffffffff` when running `mempalace`, it means a legacy Scoop shim (in `C:\Users\Admin\scoop\shims\`) is broken and trying to resolve to a deleted path.
   - Clean up old shims using: `Remove-Item C:\Users\Admin\scoop\shims\mempalace* -Force`
   - Always restart the terminal or IDE to clear cached PATH paths after cleaning up shims.
3. **Process Lock / Access Denied**:
   - If `Access is denied` occurs when renaming/moving MemPalace folders, terminate the active MCP processes first:
     `Stop-Process -Id <pid> -Force` (specifically searching for `mempalace-mcp` or `python` instances in the venv).
4. **WDAC (Application Control policy has blocked this file)**:
   - Nếu gặp lỗi `An Application Control policy has blocked this file` khi chạy `mempalace-mcp.exe`, nguyên nhân là WDAC enforcement chặn binary cũ.
   - Fix: `uv tool install mempalace --force --reinstall` để tạo lại binary mới với hash sạch.
   - Luôn restart IDE/terminal sau khi reinstall.
5. **Palace Data Path (v3.5.0+)**:
   - Từ v3.5.0, dữ liệu ChromaDB (`chroma.sqlite3`) nằm trong subfolder `palace/`.
   - Đường dẫn MCP `--palace` phải trỏ tới: `C:\Users\<youruser>\OneDrive\Documents\MemPalace\palace` (KHÔNG phải thư mục root `MemPalace`).
   - Data OneDrive sync: 4915+ drawers, 7 wings — được đồng bộ qua OneDrive tự động.

## Platform/Web Guidelines

When working on features, UI components, or logic within `platform/web`, you MUST strictly adhere to the following rules regarding Cross-Platform Compatibility:

1. **Cross-Platform Thinking First**: The concept of "Cross-Platform" is the core architecture of OmniDesk. Every piece of code, UI adjustment, and feature request for `platform/web` MUST be evaluated through a cross-platform lens before implementation.
2. **Unified Codebase (Web & Desktop)**: Remember that the React frontend (`platform/web`) serves as the view layer for both the Web Browser and the Tauri Desktop Application. Avoid writing environment-specific code without proper abstraction.
3. **Responsive & Adaptive UI**: Ensure all components render flawlessly across different operating systems, window sizes, and browser contexts. Avoid hardcoding dimensions that break in smaller Tauri windows or mobile browsers.
4. **Graceful Fallbacks**: If a native Tauri API is necessary (e.g., File System, OS integrations), ALWAYS implement a Web equivalent (e.g., Browser File API) or provide a graceful fallback UI for when the app runs in a standard browser context.

