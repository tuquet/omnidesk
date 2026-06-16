import { Download, Upload, Image, Search, Trash2 } from 'lucide-react';

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Completed';
  tags: string[];
}

export const PROJECT_DATA: Record<string, ProjectInfo> = {
  nhaatelier: {
    id: 'nhaatelier',
    name: 'Nha Atelier Tattoo Studio',
    description:
      'WordPress GitOps content sync application powered by wp-sync-cli, managing content and media library.',
    status: 'Active',
    tags: ['WordPress', 'GitOps', 'TypeScript', 'CLI'],
  },
};

export const PROJECT_ACTIONS = [
  {
    name: 'Pull Content',
    description: 'Pull content (Pages, Blocks, Menus) from WordPress to Local Markdown.',
    icon: Download,
    script: 'pull',
    variant: 'default' as const,
  },
  {
    name: 'Push Content',
    description: 'Push modified local Markdown pages and blocks back to WordPress site.',
    icon: Upload,
    script: 'push',
    variant: 'default' as const,
  },
  {
    name: 'Pull Media',
    description: 'Download WordPress media library catalog to local database (medias.json).',
    icon: Image,
    script: 'pull-media',
    variant: 'secondary' as const,
  },
  {
    name: 'Scan Media',
    description: 'Scan local Markdown content files to detect unused trash media files.',
    icon: Search,
    script: 'scan-media',
    variant: 'secondary' as const,
  },
  {
    name: 'Clean Media',
    description: 'Permantently delete all detected unused images from WordPress server.',
    icon: Trash2,
    script: 'clean-media',
    variant: 'outline' as const,
  },
];
