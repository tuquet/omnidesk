import type { LucideIcon } from 'lucide-react';

export type AppCategory = 'Core' | 'Productivity' | 'Analytics' | 'Development' | 'Utilities';

export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: AppCategory;
  is_core: boolean;
  sort_order: number;
  created_at: string;
  current_version?: string;
  download_url?: string | null;
}

export interface InstalledAppDetails {
  app_id: string;
  version: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: AppCategory;
  isCore?: boolean;
  href?: string;
}

export interface InstalledApp {
  user_id: string;
  app_id: string;
  marketplace_apps: {
    id: string;
    name: string;
    package_hash?: string;
  };
}
