/**
 * Microservice API configurations.
 * Each domain has its own dedicated microservice backend.
 */
export const RUNTIME_PORT = import.meta.env.VITE_API_PORT || '1424';
export const PROFILE_PORT = import.meta.env.VITE_PROFILE_PORT || '1421';
export const WORKFLOW_PORT = import.meta.env.VITE_WORKFLOW_PORT || '1422';

export const API_BASE_URL = `http://localhost:${RUNTIME_PORT}`;
export const PROFILE_API_URL = `http://localhost:${PROFILE_PORT}`;
export const WORKFLOW_API_URL = `http://localhost:${WORKFLOW_PORT}`;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function profileApiUrl(path: string): string {
  return `${PROFILE_API_URL}${path}`;
}

export function workflowApiUrl(path: string): string {
  return `${WORKFLOW_API_URL}${path}`;
}
