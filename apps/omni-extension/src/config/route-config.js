export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  ABOUT: '/about',
  BACKUP: '/backup',
  RECORDING: '/recording',
  WORKFLOWS: '/workflows',
  WORKFLOW_DETAIL: (id) => `/workflows/${id}`,
  WORKFLOW_SHARED: (id) => `/workflows/${id}/shared`,
  WORKFLOW_HOST: (hostId) => `/workflows/${hostId}/host`,
  TEAM_WORKFLOW: (teamId, workflowId) => `/teams/${teamId}/workflows/${workflowId}`,
};
