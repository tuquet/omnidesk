---
name: tauri-axum-backend-best-practices
description: 'Best practices and architectural rules for the Rust Backend (Tauri + Axum + SQLx).'
---

# Tauri & Axum Backend Best Practices

This skill outlines the strict architectural rules established by the Techlead for writing Rust backend code in this monorepo. The backend consists of a **Tauri Desktop App** and an **Axum API Gateway** running side-by-side, sharing a SQLite database via **SQLx**.

## 1. Project Structure

When adding new backend functionality, follow this directory structure:

- `src/api/routes.rs` — Define Axum routers here.
- `src/api/handlers/` — HTTP request handlers (e.g., `user.rs`, `apps.rs`). **Do not put handlers directly in `mod.rs`**.
- `src/commands/` — Tauri IPC commands (`#[tauri::command]`).
- `src/services/` — Core business logic. Shared logic that both Axum handlers and Tauri commands use must go here.
- `src/error.rs` — Global `AppError` enum for the whole application.
- `src/db/` — SQLx database initialization and migrations.

## 2. Error Handling (AppError)

**Never** use `unwrap()` or return `impl IntoResponse` with raw `serde_json::json!` for errors.
Always use the unified `crate::error::AppError`.

```rust
use crate::error::AppError;

pub async fn get_user_data(
    State(state): State<AppState>,
    claims: Claims
) -> Result<Json<UserData>, AppError> {
    let user = sqlx::query_as!(UserData, "SELECT * FROM users WHERE id = ?", claims.user_id())
        .fetch_one(&state.db)
        .await?; // Automatic conversion to AppError::Database

    Ok(Json(user))
}
```

For Tauri Commands, `AppError` is automatically converted to `String` (or you can implement `serde::Serialize` for `AppError` if returning structured errors to the frontend).

## 3. The Dual-Interface Principle (DRY)

Because we have an Axum server (for cloud API clients) and Tauri IPC (for the local desktop frontend), you must avoid duplicating logic.

- **Bad**: Writing a SQL query inside a Tauri command, and copying the exact same SQL query inside an Axum handler.
- **Good**: Writing a function in `src/services/app_service.rs`:
  ```rust
  pub async fn install_app_impl(pool: &SqlitePool, app_id: &str) -> Result<(), AppError> { ... }
  ```
  Then calling `install_app_impl` from both the Axum handler and the Tauri command.

## 4. API Documentation (Utoipa)

Every new Axum API endpoint **MUST** be documented using Utoipa.

1. Add the `#[utoipa::path(...)]` macro above your handler.
2. Register the handler in the `ApiDoc` struct located in `src/api/mod.rs` (or wherever the `OpenApi` macro is derived).

Example:

```rust
#[utoipa::path(
    post,
    path = "/api/apps/install",
    responses(
        (status = 200, description = "App installed successfully"),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn install_app(...) -> Result<impl IntoResponse, AppError> { ... }
```

## 5. Product & UI Behavior Rules

As a Techlead, the following interactions must be strictly adhered to:

- **No WebViews for External Content**: **NEVER** use an internal WebView to open external websites (like OAuth login pages, Supabase auth flows, or external SaaS tools).
- **System Browser & Deep Links**: Always use `tauri_plugin_shell::shell::open` to launch external URLs in the user's default OS browser. Rely on the registered Deep Link scheme (`kbm://`) to securely return data (like OAuth tokens) back to the desktop application.

## Summary Checklist for Agents

When tasked with adding a new backend feature:

- [ ] Did I create/update the `AppError` enum if new error types are needed?
- [ ] Is the business logic placed in `src/services/` if it's shared between Tauri and Axum?
- [ ] Did I add `#[utoipa::path]` to the new Axum handler?
- [ ] Did I register the handler in `ApiDoc` and `Router`?
- [ ] If handling external URLs/Auth, did I use the OS default browser instead of an internal WebView?

## 6. Common Rust Errors in this Project

When refactoring or adding new Axum routes/Tauri commands, watch out for these common errors:

- **Missing \http\ crate (E0433)**: Do not use \http::StatusCode\ directly if the \http\ crate is not in \Cargo.toml\. Instead, use the re-exported \xum::http::StatusCode\.
- **Unused imports**: Always clean up unused imports (like \http::StatusCode\) when refactoring to avoid compiler warnings.
- **Strict Typing (ny) in TypeScript**: (Note for Frontend/UI) When interacting with untyped JSON data from Tauri/Axum, avoid using \ny\ as it triggers strict ESLint rules (\@typescript-eslint/no-unsafe-assignment\). Provide proper TypeScript types (e.g., \Record<string, unknown>\ or extend types) when parsing SQLite/JSON structures.

