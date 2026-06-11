import { z } from 'zod';

// ─── Issue Schemas ──────────────────────────────────────────────────────────

/** Runtime validation schema for a single Issue entity */
export const issueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  assigneeId: z.string().nullable().optional(),
  projectId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export type Issue = z.infer<typeof issueSchema>;

/** Schema for paginated issue list response */
export const issueListResponseSchema = z.object({
  data: z.array(issueSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }).optional(),
});

// ─── Create Issue Form Schema ───────────────────────────────────────────────

/** Zod schema for the Create Issue form — validates form input at runtime */
export const createIssueFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']).default('Open'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  assigneeId: z.string().nullable().optional(),
});

export type CreateIssueFormValues = z.infer<typeof createIssueFormSchema>;

// ─── Login Form Schema ──────────────────────────────────────────────────────

export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
