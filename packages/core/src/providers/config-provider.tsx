import { createContext, useContext, ReactNode } from 'react';

export interface NavItem {
  title?: string;
  name?: string;
  url: string;
  icon: any;
  requiredPermission?: any;
}

export interface BreadcrumbEntry {
  label: string;
  url: string;
  siblings?: BreadcrumbEntry[];
}

export interface AppConfig {
  navMain: NavItem[];
  navDocuments: NavItem[];
  navSecondary: NavItem[];
  navShowcase: { label: string; requiredPermission?: any; items: NavItem[] };
  navErrorPages: { label: string; requiredPermission?: any; items: NavItem[] };
  breadcrumbMap: Record<string, BreadcrumbEntry[]>;
  githubRepo?: string;
  githubIssues?: string;
  apiDocsUrl?: string;
}

export interface RBACAdapter {
  can: (permission: any) => boolean;
  filterNav: <T extends { requiredPermission?: any }>(items: T[]) => T[];
  rbacEnabled: boolean;
}

interface AppConfigContextValue {
  config: AppConfig;
  rbac: RBACAdapter;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}

export function AppConfigProvider({ 
  config, 
  rbac, 
  children 
}: AppConfigContextValue & { children: ReactNode }) {
  return (
    <AppConfigContext.Provider value={{ config, rbac }}>
      {children}
    </AppConfigContext.Provider>
  );
}
