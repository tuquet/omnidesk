/**
 * Shared constants across the OmniDesk ecosystem.
 */

export const STORAGE_KEYS = {
  LAYOUT: 'omnidesk-layout-state',
  WORKSPACE: 'omnidesk-workspace-state',
  AUTH: 'omnidesk-auth',
  LAUNCHER: 'omnidesk-launcher',
} as const;

export const IPC_EVENTS = {
  E2E_LOG: 'e2e-log',
  DEEP_LINK_RECEIVED: 'deep-link-received',
} as const;

export const IPC_COMMANDS = {
  ENSURE_AUTOMA_EXTENSION: 'ensure_automa_extension',
} as const;

export const WS_EVENTS = {
  PING: 'ping',
  EXTENSION_READY: 'extension_ready',
  EXECUTE_WORKFLOW: 'execute_workflow',
  BLOCK_STARTED: 'block_started',
  BLOCK_FINISHED: 'block_finished',
  WORKFLOW_FINISHED: 'workflow_finished',
} as const;

export const APP_SCHEME = 'omnidesk-runtime';
export const OAUTH_REDIRECT = `${APP_SCHEME}://auth/callback`;

export const ROLES = {
  GUEST: 'GUEST',
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];
