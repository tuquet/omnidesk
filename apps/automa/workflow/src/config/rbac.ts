/**
 * Feature-flag & RBAC configuration.
 *
 * `VITE_RBAC_ENABLED` env var controls whether role-based menu
 * filtering is active.  When **disabled** every menu item is
 * visible (guest/client mode – great for demos & boilerplate).
 */
import type { Role } from '@omnidesk/auth';

// ─── Feature Flags (from Vite env) ──────────────────────────────────────────

/** When `true`, navigation items are filtered by the user's role. */
export const RBAC_ENABLED: boolean =
  import.meta.env.VITE_RBAC_ENABLED === 'true';

// ─── Permission Definitions ─────────────────────────────────────────────────

/**
 * Each permission string maps to one or more roles that may access it.
 * Permissions are referenced by navigation items via `requiredPermission`.
 *
 * Convention:  `<resource>:<action>`
 */
export const PERMISSIONS = {
  // Dashboard & analytics
  'dashboard:view': ['USER', 'ADMIN'],
  'analytics:view': ['USER', 'ADMIN'],

  // Team management
  'team:view': ['USER', 'ADMIN'],
  'team:manage': ['ADMIN'],

  // Projects
  'projects:view': ['USER', 'ADMIN'],
  'projects:create': ['USER', 'ADMIN'],
  'projects:delete': ['ADMIN'],

  // System
  'settings:view': ['USER', 'ADMIN'],
  'settings:manage': ['ADMIN'],

  // Showcase / dev pages — always visible (or ADMIN-only in strict mode)
  'showcase:view': ['USER', 'ADMIN'],
  'error-pages:view': ['USER', 'ADMIN'],

  // Documents
  'documents:view': ['USER', 'ADMIN'],
  'documents:manage': ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check whether a given role satisfies a permission.
 *
 * - If RBAC is **disabled** → always returns `true`.
 * - If `permission` is `undefined` → always returns `true`
 *   (public / unrestricted item).
 */
export function hasPermission(
  role: Role,
  permission: Permission | undefined,
): boolean {
  if (!RBAC_ENABLED) return true;
  if (!permission) return true;
  const allowed = PERMISSIONS[permission];
  return (allowed as readonly string[]).includes(role);
}
