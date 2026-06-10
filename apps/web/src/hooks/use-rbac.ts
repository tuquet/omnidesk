import { useAuth } from '@/features/auth/stores/use-auth-store';
import { hasPermission, RBAC_ENABLED, type Permission } from '@/config/rbac';
import type { Role } from '@/features/auth/stores/use-auth-store';

/**
 * Hook that provides RBAC-aware helpers for the current user.
 *
 * When `VITE_RBAC_ENABLED=false` (default for boilerplate), every
 * `can()` call returns `true` — so all menus render unconditionally.
 *
 * @example
 * ```tsx
 * const { can, filterNav } = useRBAC();
 *
 * // Check a single permission
 * if (can('team:manage')) { ... }
 *
 * // Filter an array of nav items by their `requiredPermission`
 * const visibleItems = filterNav(NAV_MAIN);
 * ```
 */
export function useRBAC() {
  const { role } = useAuth();

  /**
   * Check whether the current user has a specific permission.
   */
  const can = (permission: Permission | undefined): boolean =>
    hasPermission(role, permission);

  /**
   * Filter a list of navigation items, keeping only those the
   * current user is allowed to see.
   */
  function filterNav<T extends { requiredPermission?: Permission }>(
    items: T[],
  ): T[] {
    if (!RBAC_ENABLED) return items;
    return items.filter((item) => hasPermission(role, item.requiredPermission));
  }

  /**
   * Whether RBAC filtering is currently active.
   */
  const rbacEnabled = RBAC_ENABLED;

  return { role, can, filterNav, rbacEnabled } as const;
}
