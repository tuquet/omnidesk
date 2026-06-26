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

import { appInfo as fileBrowserInfo } from '@omnidesk/app-file-browser';
import { appInfo as automaInfo } from '@omnidesk/app-automa';
import { CodeIcon } from 'lucide-react';
export const APP_REGISTRY: Record<string, AppDefinition> = {
  'developer-console': {
    id: 'developer-console',
    name: 'Developer Console',
    description: 'Publish and manage third-party apps for OmniDesk.',
    icon: CodeIcon,
    category: 'Development',
    isCore: true,
  },
  'file-browser': fileBrowserInfo,
  'automa': automaInfo,
};
