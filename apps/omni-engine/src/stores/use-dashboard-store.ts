import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import { WORKFLOW_API_URL, PROFILE_API_URL } from '@omnidesk/core';
import { IPC_COMMANDS, IPC_EVENTS } from '@omnidesk/types';
import { tauriAdapter } from '../lib/tauri-adapter';

export interface DashboardState {
  workflows: { id: string; name: string }[];
  profiles: { id: string; name: string }[];
  selectedWorkflow: string;
  selectedProfiles: Record<string, boolean>;
  logs: string[];
  isRunning: boolean;
  isLoading: boolean;
}

const initialState: DashboardState = {
  workflows: [],
  profiles: [],
  selectedWorkflow: '',
  selectedProfiles: {},
  logs: [],
  isRunning: false,
  isLoading: false,
};

export const dashboardStore = new Store<DashboardState>(initialState);

export const dashboardActions = {
  async fetchInitialData() {
    dashboardStore.setState((s) => ({ ...s, isLoading: true }));
    
    // Using fetch directly as we need absolute URLs, but omitting local try-catch
    const [workflowsRes, profilesRes] = await Promise.all([
      fetch(`${WORKFLOW_API_URL}/api/automa/workflows`).then(r => r.json() as Promise<{ id: string; name: string }[]>),
      fetch(`${PROFILE_API_URL}/api/browser-profiles`).then(r => r.json() as Promise<{ id: string; name: string }[]>),
    ]);

    const workflows = Array.isArray(workflowsRes) ? workflowsRes : [];
    const profiles = Array.isArray(profilesRes) ? profilesRes : [];

    const initialSelection: Record<string, boolean> = {};
    profiles.slice(0, 3).forEach((p) => {
      initialSelection[p.id] = true;
    });

    dashboardStore.setState((s) => ({
      ...s,
      workflows,
      profiles,
      selectedWorkflow: workflows.length > 0 ? (workflows[0]?.id ?? '') : '',
      selectedProfiles: initialSelection,
      isLoading: false,
    }));
  },

  setSelectedWorkflow(id: string) {
    dashboardStore.setState((s) => ({ ...s, selectedWorkflow: id }));
  },

  toggleProfile(id: string) {
    dashboardStore.setState((s) => ({
      ...s,
      selectedProfiles: {
        ...s.selectedProfiles,
        [id]: !s.selectedProfiles[id],
      },
    }));
  },

  appendLog(message: string) {
    dashboardStore.setState((s) => ({ ...s, logs: [...s.logs, message] }));
  },

  async runWorkflow() {
    const state = dashboardStore.state;
    dashboardStore.setState((s) => ({
      ...s,
      isRunning: true,
      logs: ['[SYSTEM] Initializing orchestration sequence...'],
    }));

    const activeProfiles = state.profiles.filter((p) => state.selectedProfiles[p.id]);

    if (!state.selectedWorkflow) {
      dashboardActions.appendLog('[SYSTEM] ERROR: No workflow selected.');
      dashboardStore.setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    if (activeProfiles.length === 0) {
      dashboardActions.appendLog('[SYSTEM] ERROR: No profiles selected.');
      dashboardStore.setState((s) => ({ ...s, isRunning: false }));
      return;
    }

    await tauriAdapter.invoke(IPC_COMMANDS.ENSURE_AUTOMA_EXTENSION);
    dashboardActions.appendLog(`[SYSTEM] Allocated ${activeProfiles.length} browser profile(s).`);

    for (const profile of activeProfiles) {
      dashboardActions.appendLog(`[SYSTEM] Requesting launch for Profile: ${profile.name}...`);
      
      const res = await fetch(
        `${PROFILE_API_URL}/api/browser-profiles/${profile.id}/launch`,
        { method: 'POST' }
      );

      if (res.ok) {
        dashboardActions.appendLog(`[PROFILE ${profile.name}] Browser launched successfully.`);
      } else {
        dashboardActions.appendLog(`[PROFILE ${profile.name}] ERROR: Failed to launch browser.`);
      }
    }

    dashboardActions.appendLog('[SYSTEM] Triggering workflow execution via WebSockets... (Pending)');

    setTimeout(() => {
      dashboardStore.setState((s) => ({
        ...s,
        isRunning: false,
        logs: [...s.logs, '[SYSTEM] Orchestration complete.'],
      }));
    }, 3000);
  },

  async initListeners() {
    return tauriAdapter.listen<string>(IPC_EVENTS.E2E_LOG, (payload) => {
      dashboardActions.appendLog(payload);
    });
  }
};

export function useDashboardStore() {
  return useStore(dashboardStore);
}
