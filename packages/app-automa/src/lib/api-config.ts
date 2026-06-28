/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * Local API config — mirrors packages/core/src/lib/api-config.ts
 * Avoids cyclic dependency: app-automa -> core -> app-launcher -> app-automa
 */
export const RUNTIME_PORT = import.meta.env.VITE_API_PORT || '1423';
export const WORKFLOW_PORT = import.meta.env.VITE_WORKFLOW_PORT || '1422';
export const PROFILE_PORT = import.meta.env.VITE_PROFILE_PORT || '1421';

export const API_BASE_URL = `http://localhost:${RUNTIME_PORT}`;
export const WORKFLOW_API_URL = `http://localhost:${WORKFLOW_PORT}`;
export const PROFILE_API_URL = `http://localhost:${PROFILE_PORT}`;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function workflowApiUrl(path: string): string {
  return `${WORKFLOW_API_URL}${path}`;
}

export function profileApiUrl(path: string): string {
  return `${PROFILE_API_URL}${path}`;
}
