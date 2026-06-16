import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { issueListResponseSchema, type Issue, type CreateIssueFormValues } from '../schemas';

// ─── Mock API Layer (replace with real API calls later) ─────────────────────

const MOCK_ISSUES: Issue[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `ISS-${1000 + i}`,
  title: `Fix bug in module ${i + 1}`,
  description: `Detailed description for issue ${i + 1}`,
  status: (['Open', 'In Progress', 'Resolved', 'Closed'] as const)[Math.floor(Math.random() * 4)] as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
  priority: (['Low', 'Medium', 'High', 'Critical'] as const)[Math.floor(Math.random() * 4)] as 'Low' | 'Medium' | 'High' | 'Critical',
  assigneeId: null,
  projectId: 'PRJ-001',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}));

async function fetchIssues(filters?: IssueFilters): Promise<{ data: Issue[]; meta?: { total: number; page: number; pageSize: number } }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));
  let filtered = [...MOCK_ISSUES];
  if (filters?.status) {
    filtered = filtered.filter((i) => i.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((i) => i.title.toLowerCase().includes(q));
  }
  return { data: filtered, meta: { total: filtered.length, page: 1, pageSize: filtered.length } };
}

async function createIssueApi(dto: CreateIssueFormValues): Promise<Issue> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    id: `ISS-${Date.now()}`,
    ...dto,
    status: dto.status ?? 'Open',
    priority: dto.priority ?? 'Medium',
    createdAt: new Date().toISOString(),
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IssueFilters {
  status?: Issue['status'];
  priority?: Issue['priority'];
  search?: string;
}

// ─── Query Key Factory ──────────────────────────────────────────────────────

/**
 * Centralized query key factory — prevents key duplication and
 * enables targeted cache invalidation.
 *
 * @example
 * ```ts
 * // Invalidate all issue lists (any filter):
 * queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
 *
 * // Invalidate a specific issue detail:
 * queryClient.invalidateQueries({ queryKey: issueKeys.detail('ISS-1001') });
 * ```
 */
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters?: IssueFilters) => [...issueKeys.lists(), filters] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
};

// ─── Query Hooks ────────────────────────────────────────────────────────────

/**
 * Fetch paginated/filtered issue list with Zod runtime validation.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useIssues({ status: 'Open' });
 * ```
 */
export function useIssues(filters?: IssueFilters) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => fetchIssues(filters),
    select: (data) => issueListResponseSchema.parse(data),
  });
}

/**
 * Fetch a single issue by ID.
 */
export function useIssue(id: string) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const issue = MOCK_ISSUES.find((i) => i.id === id);
      if (!issue) throw new Error(`Issue ${id} not found`);
      return issue;
    },
    enabled: !!id,
  });
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

/**
 * Create a new issue with automatic cache invalidation and toast feedback.
 *
 * @example
 * ```tsx
 * const createIssue = useCreateIssue();
 * await createIssue.mutateAsync({ title: 'New bug', priority: 'High' });
 * ```
 */
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIssueApi,
    onSuccess: (newIssue) => {
      // Invalidate all list queries to refetch with the new issue
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      toast.success(`Issue ${newIssue.id} created`);
    },
    onError: (error) => {
      toast.error(`Failed to create issue: ${error.message}`);
    },
  });
}
