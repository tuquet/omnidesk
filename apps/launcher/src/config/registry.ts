import type { LucideIcon } from 'lucide-react';

export type AppCategory = 'Core' | 'Productivity' | 'Analytics' | 'Development' | 'Utilities';

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: AppCategory;
  /** Whether the app is a core system app that cannot be uninstalled */
  isCore?: boolean;
  href?: string;
}

import { appInfo as automaInfo } from '@omnidesk/app-automa';
export const APP_REGISTRY: Record<string, AppDefinition> = {
  'automa': automaInfo,
};
