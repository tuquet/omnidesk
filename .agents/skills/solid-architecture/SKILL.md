---
name: solid-architecture
description: "Core architectural guidelines, SOLID principles, API design, and DB migration rules. Use this skill when reviewing code, designing new features, or restructuring the backend/frontend architecture."
---

# Architecture (SOLID & Best Practices)

As an AI Agent modifying the codebase, you MUST evaluate architectural code changes against the **SOLID Principles** enforced by strict design philosophies:

## 1. Single Responsibility Principle (SRP) & Micro-App Isolation
- **Domain Strictness**: Applications and shared packages (e.g., `apps/` and `packages/`) MUST NOT import from each other directly. Extract specific domains into isolated packages (e.g., a `ui` package handles only pure UI, an `auth` package handles only authentication).
- **Rule**: If you find yourself writing business logic in a View component, or DB logic in the Frontend, you are violating SRP. Stop and decouple it. All inter-app communication must route through proper abstractions (e.g., an API Gateway or Event Bus).
- **Frontend Architecture**: If supporting multiple platforms (e.g., Desktop/Web), universal features must be extracted to shared packages to maintain single responsibility.

## 2. Open/Closed Principle (OCP) & Scalable Extensibility
- **UI Composition**: Always prioritize using base component libraries (e.g., `shadcn/ui`) before building custom features. Do not mutate base UI components to force new behavior; extend them via composition and utility classes (e.g., Tailwind CSS).
- **Background Processes**: Adding new data models should simply extend the background sync logic without breaking existing offline functionality.

## 3. Liskov Substitution Principle (LSP) & Cross-Platform Predictability
- **Cross-Platform by Default**: Ensure all universal code works flawlessly across its intended platforms (e.g., Desktop, Web, Mobile). Never hardcode constraints that break on smaller viewports or different environments.
- **Graceful Fallbacks**: If utilizing Native APIs (e.g., Tauri/Electron `fs`) in universal packages, ALWAYS implement a Web equivalent (e.g., Browser File API). A Web runtime must be able to perfectly substitute a Native runtime without crashing.

## 4. Interface Segregation Principle (ISP) & API Granularity
- **Decoupled Gateway**: If the backend offers multiple communication layers (e.g., IPC commands and an HTTP gateway), clients must only depend on the interfaces they need.
- **State Management**: **Always** use granular global state management (e.g., `@tanstack/store`). Do **NOT** use monolithic state libraries (e.g., `redux`) unless explicitly asked or already heavily integrated.

## 5. Dependency Inversion Principle (DIP) & Backend Supremacy
- **Backend Supremacy**: The frontend is purely a view layer. It must NEVER depend directly on the file system or DB. It must depend strictly on the HTTP/RPC abstraction exposed by the Backend.
- **Local-First Architecture**: For local-first apps, writes should execute synchronously against a local database (e.g., SQLite/IndexedDB), while cloud connections (e.g., Supabase/Firebase) act strictly as background asynchronous sync layers.
- **Zero-Trust Web Auth**: Abstract external OAuth authentication out to the native system browser rather than internal WebViews, catching tokens via deep links (e.g., `app-schema://`).

## 6. Centralized API Requests & Error Handling
- **No Local Try-Catch for APIs**: All API request operations MUST be centralized in a single location (e.g., dedicated API clients or React hooks). Do NOT use `try-catch` blocks at the individual UI call sites.
- **Global Interceptors**: Let a global interceptor layer handle all error reporting and logging in a single, centralized place.

## 7. Database Migrations (e.g., SQLx / Prisma)
- **Immutable Migrations**: Never modify an existing migration file that has already been applied, as ORMs track file checksums. Modifying an old migration will result in mismatch errors at runtime.
- **Always Create New Files**: To modify a database schema, ALWAYS create a new migration file.
- **Early Development Exception**: If the app is in early development and not yet released, you may modify an existing migration file ONLY IF you explicitly warn the user that they must wipe their local DB to start fresh.

## 8. Code Reusability & DRY (Don't Repeat Yourself)
- **Avoid Function Duplication**: Before writing a new utility function or helper, always search the codebase to see if an equivalent already exists in the shared libraries.
- **Extract Shared Logic**: If you find yourself writing the exact same logic in multiple applications, STOP. Extract that logic into the appropriate shared package and import it. Do not duplicate implementations.

## 9. API Synchronization (e.g., OpenAPI to TypeScript)
- **Mandatory Sync**: Whenever you add, remove, or modify a backend API endpoint, you MUST run the API synchronization scripts (e.g., `pnpm run sync:api`) to regenerate the TypeScript API clients. Failure to run this script will result in the Frontend being out-of-sync with the Backend, leading to runtime or typecheck errors.
