import type { ReactNode } from 'react';
import { useAppConfig } from '../providers/config-provider';
type Permission = any;

interface CanProps {
  /** Permission required to render children (e.g., 'team:manage') */
  permission?: Permission;
  /** Fallback content when permission is denied */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * RBAC Wrapper Component — unified with `config/rbac.ts` permission system.
 * Shows `children` when the current user has the specified permission.
 * When RBAC is disabled (default demo mode), always renders children.
 *
 * @example
 * ```tsx
 * <Can permission="team:manage" fallback={<NoAccess />}>
 *   <TeamSettings />
 * </Can>
 *
 * // Always visible (no permission check):
 * <Can>
 *   <PublicContent />
 * </Can>
 * ```
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { rbac: { can } } = useAppConfig();

  // No permission required → always render
  if (!permission) {
    return <>{children}</>;
  }

  if (can(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
