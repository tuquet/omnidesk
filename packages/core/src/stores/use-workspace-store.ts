import { useStore } from '@tanstack/react-store';
import { createPersistentStore } from './utils';

export interface WorkspaceState {
  selectedWorkspacePath: string | null;
}

export const workspaceStore = createPersistentStore<WorkspaceState>('omnidesk-workspace-state', {
  selectedWorkspacePath: null,
});

export const workspaceActions = {
  setWorkspacePath: (path: string | null) => {
    workspaceStore.setState((state) => ({ ...state, selectedWorkspacePath: path }));
  },
};

export function useWorkspaceStore() {
  const state = useStore(workspaceStore);
  return {
    ...state,
    ...workspaceActions,
  };
}
