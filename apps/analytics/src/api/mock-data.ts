import { z } from 'zod';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';

export const summaryStatSchema = z.object({
  title: z.string(),
  value: z.string(),
  change: z.string(),
  trend: z.enum(['up', 'down']),
  description: z.string(),
});

export type SummaryStat = z.infer<typeof summaryStatSchema>;

export const trafficSourceSchema = z.object({
  source: z.string(),
  type: z.string(),
  visitors: z.string(),
  bounceRate: z.string(),
  avgDuration: z.string(),
});

export type TrafficSource = z.infer<typeof trafficSourceSchema>;

export const topPageSchema = z.object({
  page: z.string(),
  views: z.string(),
  unique: z.string(),
});

export type TopPage = z.infer<typeof topPageSchema>;

export const deviceBreakdownSchema = z.object({
  device: z.string(),
  percentage: z.number(),
  icon: z.any(),
});

export type DeviceBreakdown = z.infer<typeof deviceBreakdownSchema>;

export const summaryStats = z.array(summaryStatSchema).parse([
  {
    title: 'Page Views',
    value: '284,921',
    change: '+12.5%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Unique Visitors',
    value: '52,831',
    change: '+8.2%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Bounce Rate',
    value: '32.4%',
    change: '-3.1%',
    trend: 'down' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Avg. Session',
    value: '4m 32s',
    change: '+0.8%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
]);

export const trafficSources = z.array(trafficSourceSchema).parse([
  {
    source: 'Organic Search',
    type: 'organic',
    visitors: '23,841',
    bounceRate: '28.3%',
    avgDuration: '5m 12s',
  },
  {
    source: 'Direct',
    type: 'direct',
    visitors: '14,205',
    bounceRate: '35.7%',
    avgDuration: '3m 48s',
  },
  {
    source: 'Social Media',
    type: 'social',
    visitors: '8,932',
    bounceRate: '42.1%',
    avgDuration: '2m 55s',
  },
  {
    source: 'Referral',
    type: 'referral',
    visitors: '4,117',
    bounceRate: '25.9%',
    avgDuration: '6m 03s',
  },
  {
    source: 'Email',
    type: 'email',
    visitors: '1,736',
    bounceRate: '19.4%',
    avgDuration: '7m 21s',
  },
]);

export const topPages = z.array(topPageSchema).parse([
  { page: '/dashboard', views: '42,318', unique: '28,491' },
  { page: '/products', views: '31,205', unique: '22,847' },
  { page: '/blog/getting-started', views: '18,924', unique: '15,302' },
  { page: '/pricing', views: '14,671', unique: '11,983' },
  { page: '/docs/api-reference', views: '9,847', unique: '7,621' },
]);

export const deviceBreakdown = z.array(deviceBreakdownSchema).parse([
  {
    device: 'Desktop',
    percentage: 64,
    icon: MonitorIcon,
  },
  {
    device: 'Mobile',
    percentage: 28,
    icon: SmartphoneIcon,
  },
  {
    device: 'Tablet',
    percentage: 8,
    icon: TabletIcon,
  },
]);

export const sourceBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  organic: 'default',
  direct: 'secondary',
  social: 'outline',
  referral: 'secondary',
  email: 'outline',
};
