/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * Microservice API configurations.
 * Each domain has its own dedicated microservice backend.
 */
export const API_HOST = import.meta.env.VITE_API_HOST || '127.0.0.1';

export const RUNTIME_PORT = import.meta.env.VITE_API_PORT || '1423';
export const PROFILE_PORT = import.meta.env.VITE_PROFILE_PORT || '1421';
export const WORKFLOW_PORT = import.meta.env.VITE_WORKFLOW_PORT || '1422';
export const ENGINE_PORT = import.meta.env.VITE_ENGINE_PORT || '1424';

export const API_BASE_URL = `http://${API_HOST}:${RUNTIME_PORT}`;
export const PROFILE_API_URL = `http://${API_HOST}:${PROFILE_PORT}`;
export const WORKFLOW_API_URL = `http://${API_HOST}:${WORKFLOW_PORT}`;
export const ENGINE_API_URL = `http://${API_HOST}:${ENGINE_PORT}`;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function profileApiUrl(path: string): string {
  return `${PROFILE_API_URL}${path}`;
}

export function workflowApiUrl(path: string): string {
  return `${WORKFLOW_API_URL}${path}`;
}

export function engineApiUrl(path: string): string {
  return `${ENGINE_API_URL}${path}`;
}
