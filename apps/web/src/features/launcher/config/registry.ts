import type { LucideIcon } from 'lucide-react';
import {
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CompassIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  RefreshCw,
} from 'lucide-react';

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

export const APP_REGISTRY: Record<string, AppDefinition> = {
  'wordpress-sync': {
    id: 'wordpress-sync',
    name: 'WordPress Sync',
    description: 'WordPress GitOps content & media synchronization workspace.',
    icon: RefreshCw,
    category: 'Development',
  },
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Central overview and control panel.',
    icon: CompassIcon,
    category: 'Core',
    isCore: true,
  },
  lifecycle: {
    id: 'lifecycle',
    name: 'Lifecycle',
    description: 'Track software development lifecycle stages.',
    icon: ListIcon,
    category: 'Productivity',
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data analytics and reporting tools.',
    icon: ChartBarIcon,
    category: 'Analytics',
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Manage and track ongoing projects.',
    icon: FolderIcon,
    category: 'Productivity',
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'Manage team members and permissions.',
    icon: UsersIcon,
    category: 'Core',
  },
  documents: {
    id: 'documents',
    name: 'Documents',
    description: 'Data library, reports, and document management.',
    icon: DatabaseIcon,
    category: 'Productivity',
    href: '/documents/data-library',
  },
  showcase: {
    id: 'showcase',
    name: 'UI Showcase',
    description: 'Component library showcase for developers.',
    icon: CompassIcon,
    category: 'Development',
    href: '/showcase/buttons',
  },
  'error-pages': {
    id: 'error-pages',
    name: 'Error Pages Simulator',
    description: 'Test environment for various HTTP error states.',
    icon: AlertTriangleIcon,
    category: 'Development',
    href: '/401',
  },
};
