import type { LucideIcon } from 'lucide-react';
import type { Permission } from './rbac';
import {
  LayoutDashboardIcon,
  ActivityIcon,
  TerminalIcon,
  SettingsIcon,
  StoreIcon,
  CalendarIcon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  name: string;
  url: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
}

// ─── Navigation Groups ──────────────────────────────────────────────────────

export const NAV_MAIN: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
  { title: 'Job Scheduler', url: '/scheduler', icon: CalendarIcon },
  { title: 'Active Jobs', url: '/active-jobs', icon: ActivityIcon },
  { title: 'System Logs', url: '/system-logs', icon: TerminalIcon },
  { title: 'Settings', url: '/settings', icon: SettingsIcon },
];

export const NAV_SHOWCASE: NavGroup = {
  label: '',
  items: [],
};

export const NAV_ERROR_PAGES: NavGroup = {
  label: '',
  items: [],
};

/**
 * Cloud integration nav items — reserved for future cloud service connections.
 * Items here will appear in the sidebar "Clouds" section when populated.
 */
export const NAV_CLOUDS: NavItem[] = [];

export const NAV_SECONDARY: NavItem[] = [
  { title: 'App Store', url: '/app-store', icon: StoreIcon },
];

export const NAV_DOCUMENTS: DocumentItem[] = [];

// ─── Breadcrumb Route Map ───────────────────────────────────────────────────

export interface BreadcrumbEntry {
  label: string;
  url: string;
  /** Sibling pages at the same level — shown in the dropdown. */
  siblings?: { label: string; url: string }[];
}

/**
 * Build a complete breadcrumb map from the navigation groups.
 * This keeps the sidebar labels and breadcrumb labels in perfect sync.
 */
function buildBreadcrumbMap(): Record<string, BreadcrumbEntry[]> {
  const map: Record<string, BreadcrumbEntry[]> = {};

  // Main Nav (Apps)
  for (const group of NAV_MAIN) {
    if (group.items && group.items.length > 0) {
      const siblings = group.items.map((i) => ({ label: i.title, url: i.url }));
      const firstItemUrl = group.items[0]?.url ?? '';
      for (const item of group.items) {
        map[item.url] = [
          { label: group.title, url: firstItemUrl, siblings },
          { label: item.title, url: item.url },
        ];
      }
    } else {
      map[group.url] = [{ label: group.title, url: group.url }];
    }
  }

  // Showcase
  const showcaseSiblings = NAV_SHOWCASE.items.map((i) => ({ label: i.title, url: i.url }));
  const firstShowcaseUrl = NAV_SHOWCASE.items[0]?.url ?? '';
  for (const item of NAV_SHOWCASE.items) {
    map[item.url] = [
      { label: NAV_SHOWCASE.label, url: firstShowcaseUrl, siblings: showcaseSiblings },
      { label: item.title, url: item.url },
    ];
  }

  // Error Pages
  const errorSiblings = NAV_ERROR_PAGES.items.map((i) => ({ label: i.title, url: i.url }));
  const firstErrorUrl = NAV_ERROR_PAGES.items[0]?.url ?? '';
  for (const item of NAV_ERROR_PAGES.items) {
    map[item.url] = [
      { label: NAV_ERROR_PAGES.label, url: firstErrorUrl, siblings: errorSiblings },
      { label: item.title, url: item.url },
    ];
  }

  // Documents
  const docSiblings = NAV_DOCUMENTS.map((d) => ({ label: d.name, url: d.url }));
  const firstDocUrl = NAV_DOCUMENTS[0]?.url ?? '';
  for (const doc of NAV_DOCUMENTS) {
    map[doc.url] = [
      { label: 'Documents', url: firstDocUrl, siblings: docSiblings },
      { label: doc.name, url: doc.url },
    ];
  }

  // Launcher / App Store
  map['/app-store'] = [{ label: 'App Store', url: '/app-store' }];

  return map;
}

export const BREADCRUMB_MAP = buildBreadcrumbMap();
