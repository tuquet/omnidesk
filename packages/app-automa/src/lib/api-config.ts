/**
 * Local API config — mirrors packages/core/src/lib/api-config.ts
 * Avoids cyclic dependency: app-automa -> core -> app-launcher -> app-automa
 */
export const API_PORT = import.meta.env.VITE_API_PORT || '1424';
export const API_BASE_URL = `http://localhost:${API_PORT}`;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
