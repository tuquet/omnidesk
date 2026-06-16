import { z } from 'zod';

export const projectStatusSchema = z.enum(['Active', 'Planning', 'On Hold', 'Completed']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: projectStatusSchema,
  progress: z.number(),
  team: z.array(z.string()),
  extra: z.number(),
  lastUpdated: z.string(),
  tags: z.array(z.string()),
});

export type Project = z.infer<typeof projectSchema>;

export const projects = z.array(projectSchema).parse([
  {
    id: 'nhaatelier',
    name: 'Nha Atelier Tattoo Studio',
    description:
      'WordPress GitOps content sync application powered by wp-sync-cli, managing content and media library.',
    status: 'Active' as const,
    progress: 100,
    team: ['AT', 'PT'],
    extra: 0,
    lastUpdated: 'Just now',
    tags: ['WordPress', 'GitOps', 'TypeScript', 'CLI'],
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    description:
      'Complete overhaul of the corporate website with modern design patterns and improved UX.',
    status: 'Active' as const,
    progress: 72,
    team: ['JD', 'AS', 'MK'],
    extra: 3,
    lastUpdated: 'Jun 10, 2026',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  {
    id: 'mobile-app-v2',
    name: 'Mobile App v2',
    description:
      'Second major release of the mobile application with offline support and push notifications.',
    status: 'Active' as const,
    progress: 45,
    team: ['ER', 'PP'],
    extra: 2,
    lastUpdated: 'Jun 9, 2026',
    tags: ['React Native', 'TypeScript'],
  },
  {
    id: 'api-migration',
    name: 'API Migration',
    description:
      'Migrate legacy REST endpoints to a new GraphQL-based API layer with improved caching.',
    status: 'Planning' as const,
    progress: 12,
    team: ['DK', 'LA', 'JW'],
    extra: 1,
    lastUpdated: 'Jun 8, 2026',
    tags: ['Rust', 'GraphQL', 'Docker'],
  },
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Build a unified component library and design token system for all product teams.',
    status: 'Active' as const,
    progress: 88,
    team: ['MG', 'ET'],
    extra: 0,
    lastUpdated: 'Jun 10, 2026',
    tags: ['React', 'Storybook', 'Figma'],
  },
  {
    id: 'e-commerce-platform',
    name: 'E-commerce Platform',
    description:
      'Full-stack e-commerce solution with inventory management, payments, and analytics dashboard.',
    status: 'On Hold' as const,
    progress: 34,
    team: ['SC', 'AR', 'PP'],
    extra: 4,
    lastUpdated: 'May 28, 2026',
    tags: ['Python', 'PostgreSQL', 'Stripe'],
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description:
      'Real-time data ingestion and transformation pipeline for business intelligence reporting.',
    status: 'Completed' as const,
    progress: 100,
    team: ['LA', 'DK'],
    extra: 1,
    lastUpdated: 'Jun 5, 2026',
    tags: ['Rust', 'Kafka', 'ClickHouse'],
  },
]);

export function getStatusVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'default' as const;
    case 'Planning':
      return 'secondary' as const;
    case 'On Hold':
      return 'outline' as const;
    case 'Completed':
      return 'default' as const;
    default:
      return 'default' as const;
  }
}