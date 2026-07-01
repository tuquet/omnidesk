import type { LucideIcon } from 'lucide-react';
import type { Permission } from './rbac';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Optional child items for collapsible groups. */
  items?: Omit<NavItem, 'icon' | 'items'>[];
  /** If `true` the collapsible group starts open. */
  isActive?: boolean;
  /**
   * RBAC permission required to see this item.
   * When `undefined` the item is always visible.
   * When RBAC is disabled (`VITE_RBAC_ENABLED=false`) this is ignored.
   */
  requiredPermission?: Permission;
}

export interface NavGroup {
  /** Group label shown in the sidebar. */
  label: string;
  items: NavItem[];
  /** RBAC permission required to see the entire group. */
  requiredPermission?: Permission;
}

export interface DocumentItem {
  title: string;
  url: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
}

export interface BreadcrumbEntry {
  label: string;
  url: string;
  /** Sibling pages at the same level — shown in the dropdown. */
  siblings?: { label: string; url: string }[];
}
