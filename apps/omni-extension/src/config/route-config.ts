export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  ABOUT: '/about',
  BACKUP: '/backup',
  RECORDING: '/recording',
  WORKFLOWS: '/workflows',
  WORKFLOW_DETAIL: (id: string) => `/workflows/${id}`,
  WORKFLOW_SHARED: (id: string) => `/workflows/${id}/shared`,
  WORKFLOW_HOST: (hostId: string) => `/workflows/${hostId}/host`,
  TEAM_WORKFLOW: (teamId: string, workflowId: string) => `/teams/${teamId}/workflows/${workflowId}`,
} as const;
