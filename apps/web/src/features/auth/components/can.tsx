import * as React from 'react';
import { useAuth, type Role } from '../stores/use-auth-store';

const ROLE_HIERARCHY: Record<Role, number> = {
  GUEST: 0,
  USER: 1,
  ADMIN: 2,
};

interface CanProps {
  role: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RBAC Wrapper Component — hiển thị `children` khi role hiện tại >= role yêu cầu.
 *
 * @example
 * ```tsx
 * <Can role="USER" fallback={<LoginBanner />}>
 *   <SecretPanel />
 * </Can>
 * ```
 */
export function Can({ role, children, fallback = null }: CanProps) {
  const { role: currentRole } = useAuth();

  const hasAccess = ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[role];

  if (hasAccess) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
