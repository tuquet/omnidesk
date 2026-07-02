import { type NavItem, type NavGroup, type DocumentItem, type BreadcrumbEntry, type Permission } from '@omnidesk/types';
export type { NavItem, NavGroup, DocumentItem, BreadcrumbEntry, Permission };
import { PlayIcon, ActivityIcon, ZapIcon, TerminalIcon, SettingsIcon, StoreIcon } from 'lucide-react';

// ─── Navigation Groups ──────────────────────────────────────────────────────

export const NAV_MAIN: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: PlayIcon },
  { title: 'Active Runs', url: '/active-jobs', icon: ZapIcon },
  { title: 'Run History', url: '/runners', icon: ActivityIcon },
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
  const docSiblings = NAV_DOCUMENTS.map((d) => ({ label: d.title, url: d.url }));
  const firstDocUrl = NAV_DOCUMENTS[0]?.url ?? '';
  for (const doc of NAV_DOCUMENTS) {
    map[doc.url] = [
      { label: 'Documents', url: firstDocUrl, siblings: docSiblings },
      { label: doc.title, url: doc.url },
    ];
  }

  // Launcher / App Store
  map['/app-store'] = [{ label: 'App Store', url: '/app-store' }];

  return map;
}

export const BREADCRUMB_MAP = buildBreadcrumbMap();
