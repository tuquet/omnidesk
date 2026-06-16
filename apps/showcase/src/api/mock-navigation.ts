import { z } from 'zod';

export const integrationSchema = z.object({
  name: z.string(),
  status: z.string(),
  connected: z.boolean(),
});

export type Integration = z.infer<typeof integrationSchema>;

export const integrations = z.array(integrationSchema).parse([
  {
    name: 'GitHub',
    status: 'Connected',
    connected: true,
  },
  {
    name: 'Slack',
    status: 'Not connected',
    connected: false,
  },
  {
    name: 'Vercel',
    status: 'Connected',
    connected: true,
  },
  {
    name: 'Linear',
    status: 'Not connected',
    connected: false,
  },
]);

export const dashboardStatSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export type DashboardStat = z.infer<typeof dashboardStatSchema>;

export const dashboardStats = z.array(dashboardStatSchema).parse([
  { label: 'Total Projects', value: '24' },
  { label: 'Active', value: '18' },
  { label: 'Completed', value: '6' },
]);

export const projectSchema = z.string();

export type Project = z.infer<typeof projectSchema>;

export const projects = z.array(projectSchema).parse([
  'Project Alpha',
  'Project Beta',
  'Project Gamma',
]);
