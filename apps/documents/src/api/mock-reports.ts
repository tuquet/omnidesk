import { CheckCircle2Icon, LoaderIcon, ClockIcon } from 'lucide-react';
import { z } from 'zod';

export const reportStatusSchema = z.enum(['Ready', 'Processing', 'Scheduled']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportTypeSchema = z.enum(['Financial', 'Analytics', 'Marketing', 'Engineering', 'Operations']);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportSchema = z.object({
  name: z.string(),
  type: reportTypeSchema,
  status: reportStatusSchema,
  generated: z.string(),
  size: z.string(),
});

export type Report = z.infer<typeof reportSchema>;

export const reports = z.array(reportSchema).parse([
  {
    name: 'Q2 Revenue Analysis',
    type: 'Financial',
    status: 'Ready',
    generated: 'Jun 8, 2026 at 9:14 AM',
    size: '4.2 MB',
  },
  {
    name: 'Monthly Active Users',
    type: 'Analytics',
    status: 'Ready',
    generated: 'Jun 7, 2026 at 3:30 PM',
    size: '2.8 MB',
  },
  {
    name: 'Customer Churn Report',
    type: 'Analytics',
    status: 'Processing',
    generated: 'Jun 10, 2026 at 11:02 AM',
    size: '—',
  },
  {
    name: 'Performance Metrics',
    type: 'Engineering',
    status: 'Ready',
    generated: 'Jun 6, 2026 at 8:45 AM',
    size: '1.5 MB',
  },
  {
    name: 'SEO Audit Results',
    type: 'Marketing',
    status: 'Scheduled',
    generated: 'Jun 12, 2026 at 6:00 AM',
    size: '—',
  },
  {
    name: 'A/B Test Results',
    type: 'Marketing',
    status: 'Ready',
    generated: 'Jun 4, 2026 at 2:18 PM',
    size: '3.1 MB',
  },
  {
    name: 'Infrastructure Costs',
    type: 'Operations',
    status: 'Processing',
    generated: 'Jun 10, 2026 at 10:30 AM',
    size: '—',
  },
  {
    name: 'Sprint Velocity',
    type: 'Engineering',
    status: 'Ready',
    generated: 'Jun 9, 2026 at 5:00 PM',
    size: '890 KB',
  },
]);

export const statusConfig: Record<
  ReportStatus,
  { variant: 'default' | 'secondary' | 'outline'; icon: typeof CheckCircle2Icon }
> = {
  Ready: {
    variant: 'default',
    icon: CheckCircle2Icon,
  },
  Processing: {
    variant: 'secondary',
    icon: LoaderIcon,
  },
  Scheduled: {
    variant: 'outline',
    icon: ClockIcon,
  },
};

export const reportTypeBadgeVariant = (type: ReportType) => {
  switch (type) {
    case 'Financial':
      return 'default' as const;
    case 'Analytics':
      return 'secondary' as const;
    case 'Marketing':
      return 'outline' as const;
    case 'Engineering':
      return 'secondary' as const;
    case 'Operations':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};
