/**
 * Shared API configuration — single source of truth for the backend URL.
 * All packages and apps should import from here instead of hardcoding ports.
 *
 * The port is read from the VITE_API_PORT env var (set per-app in .env files).
 * Falls back to 1424 (Runtime) if not set.
 */
export const API_PORT = import.meta.env.VITE_API_PORT || '1424';
export const API_BASE_URL = `http://localhost:${API_PORT}`;

/**
 * Helper to build a full API URL from a path.
 * @example apiUrl('/api/automa/workflows') => 'http://localhost:1424/api/automa/workflows'
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
