/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API port (Axum server) */
  readonly VITE_API_PORT: string;
  /** Tauri dev server port (Vite) */
  readonly VITE_DEV_PORT: string;
  /** Enable role-based access control filtering ("true" | "false") */
  readonly VITE_RBAC_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
