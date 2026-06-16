import { DatabaseIcon, HardDriveIcon, LayersIcon } from 'lucide-react';

export const dataItems = [
  {
    name: 'Customer Analytics 2024',
    type: 'Dataset' as const,
    size: '2.4 GB',
    records: '1.2M records',
    modified: 'Jun 8, 2026',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    tags: ['production', 'v2.1', 'verified'],
  },
  {
    name: 'Sales Forecast Model',
    type: 'Model' as const,
    size: '890 MB',
    records: '450K records',
    modified: 'Jun 5, 2026',
    owner: 'James Rodriguez',
    ownerInitials: 'JR',
    tags: ['staging', 'v3.0', 'ml'],
  },
  {
    name: 'User Behavior Dataset',
    type: 'Dataset' as const,
    size: '5.1 GB',
    records: '3.8M records',
    modified: 'Jun 3, 2026',
    owner: 'Emily Park',
    ownerInitials: 'EP',
    tags: ['production', 'automated'],
  },
  {
    name: 'Product Catalog v3',
    type: 'Dataset' as const,
    size: '340 MB',
    records: '28K records',
    modified: 'May 29, 2026',
    owner: 'Michael Torres',
    ownerInitials: 'MT',
    tags: ['v3.2', 'synced'],
  },
  {
    name: 'ML Training Pipeline',
    type: 'Pipeline' as const,
    size: '1.7 GB',
    records: '920K records',
    modified: 'Jun 1, 2026',
    owner: 'Aisha Patel',
    ownerInitials: 'AP',
    tags: ['automated', 'gpu', 'nightly'],
  },
  {
    name: 'Revenue Dashboard Data',
    type: 'Dataset' as const,
    size: '680 MB',
    records: '2.1M records',
    modified: 'Jun 7, 2026',
    owner: 'David Kim',
    ownerInitials: 'DK',
    tags: ['production', 'real-time'],
  },
];

export const typeIcon = (type: string) => {
  switch (type) {
    case 'Dataset':
      return DatabaseIcon;
    case 'Model':
      return HardDriveIcon;
    case 'Pipeline':
      return LayersIcon;
    default:
      return DatabaseIcon;
  }
};

export const typeBadgeVariant = (type: string) => {
  switch (type) {
    case 'Dataset':
      return 'default' as const;
    case 'Model':
      return 'secondary' as const;
    case 'Pipeline':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};
