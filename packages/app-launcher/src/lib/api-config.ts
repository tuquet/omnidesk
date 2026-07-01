/**
 * Local API config — mirrors packages/core/src/lib/api-config.ts
 * Avoids cyclic dependency: app-launcher -> core -> app-launcher
 */
const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;

export const API_HOST = env.VITE_API_HOST || '127.0.0.1';
export const API_PORT = env.VITE_API_PORT || '1424';
export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
