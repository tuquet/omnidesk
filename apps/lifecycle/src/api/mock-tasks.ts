import { z } from 'zod';

export const taskPrioritySchema = z.enum(['Low', 'Medium', 'High']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: taskPrioritySchema,
  assignee: z.string(),
  initials: z.string(),
  dueDate: z.string(),
  progress: z.number(),
});

export type Task = z.infer<typeof taskSchema>;

export const backlogTasks = z.array(taskSchema).parse([
  {
    id: 'BL-101',
    title: 'Implement user authentication',
    priority: 'High',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 20, 2026',
    progress: 0,
  },
  {
    id: 'BL-102',
    title: 'Design onboarding flow',
    priority: 'Medium',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 25, 2026',
    progress: 5,
  },
  {
    id: 'BL-103',
    title: 'Set up CI/CD pipeline',
    priority: 'Low',
    assignee: 'Olivia Park',
    initials: 'OP',
    dueDate: 'Jul 1, 2026',
    progress: 0,
  },
  {
    id: 'BL-104',
    title: 'Create API rate limiter',
    priority: 'Medium',
    assignee: 'James Wu',
    initials: 'JW',
    dueDate: 'Jul 5, 2026',
    progress: 0,
  },
]);

export const inProgressTasks = z.array(taskSchema).parse([
  {
    id: 'IP-201',
    title: 'Refactor API layer',
    priority: 'High',
    assignee: 'David Kim',
    initials: 'DK',
    dueDate: 'Jun 15, 2026',
    progress: 65,
  },
  {
    id: 'IP-202',
    title: 'Build notification system',
    priority: 'Medium',
    assignee: 'Emily Ross',
    initials: 'ER',
    dueDate: 'Jun 18, 2026',
    progress: 40,
  },
  {
    id: 'IP-203',
    title: 'Migrate database schema',
    priority: 'High',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 14, 2026',
    progress: 80,
  },
]);

export const reviewTasks = z.array(taskSchema).parse([
  {
    id: 'RV-301',
    title: 'Add export to CSV feature',
    priority: 'Low',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 12, 2026',
    progress: 90,
  },
  {
    id: 'RV-302',
    title: 'Implement dark mode toggle',
    priority: 'Medium',
    assignee: 'Olivia Park',
    initials: 'OP',
    dueDate: 'Jun 13, 2026',
    progress: 95,
  },
  {
    id: 'RV-303',
    title: 'Update user profile page',
    priority: 'Low',
    assignee: 'James Wu',
    initials: 'JW',
    dueDate: 'Jun 11, 2026',
    progress: 85,
  },
]);

export const doneTasks = z.array(taskSchema).parse([
  {
    id: 'DN-401',
    title: 'Set up project scaffolding',
    priority: 'High',
    assignee: 'David Kim',
    initials: 'DK',
    dueDate: 'Jun 5, 2026',
    progress: 100,
  },
  {
    id: 'DN-402',
    title: 'Configure linting and formatting',
    priority: 'Low',
    assignee: 'Emily Ross',
    initials: 'ER',
    dueDate: 'Jun 6, 2026',
    progress: 100,
  },
  {
    id: 'DN-403',
    title: 'Create shared component library',
    priority: 'Medium',
    assignee: 'Sarah Chen',
    initials: 'SC',
    dueDate: 'Jun 8, 2026',
    progress: 100,
  },
  {
    id: 'DN-404',
    title: 'Integrate analytics SDK',
    priority: 'Medium',
    assignee: 'Marcus Lee',
    initials: 'ML',
    dueDate: 'Jun 9, 2026',
    progress: 100,
  },
]);

export const priorityVariant = {
  Low: 'outline' as const,
  Medium: 'secondary' as const,
  High: 'destructive' as const,
};