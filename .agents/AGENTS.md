<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

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
