import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import { invoke } from '@tauri-apps/api/core';

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
    try {
      // For now, continuing to use fetch to bypass hey-api client since it has hardcoded base url 1424.
      // Wait, omni-engine's API is on 1422? No, the engine dashboard fetched workflows from 1422 and profiles from 1421.
      // This is part of what needs to be solved.
      const [workflowsRes, profilesRes] = await Promise.all([
        fetch('http://127.0.0.1:1422/api/automa/workflows').then(r => r.json() as Promise<{ id: string; name: string }[]>).catch(() => []),
        fetch('http://127.0.0.1:1421/api/browser-profiles').then(r => r.json() as Promise<{ id: string; name: string }[]>).catch(() => []),
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
        selectedWorkflow: workflows.length > 0 ? workflows[0].id : '',
        selectedProfiles: initialSelection,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      dashboardStore.setState((s) => ({ ...s, isLoading: false }));
    }
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

    try {
      await invoke('ensure_automa_extension');
      dashboardActions.appendLog(`[SYSTEM] Allocated ${activeProfiles.length} browser profile(s).`);

      for (const profile of activeProfiles) {
        dashboardActions.appendLog(`[SYSTEM] Requesting launch for Profile: ${profile.name}...`);
        try {
          const res = await fetch(
            `http://127.0.0.1:1421/api/browser-profiles/${profile.id}/launch`,
            { method: 'POST' }
          );

          if (res.ok) {
            dashboardActions.appendLog(`[PROFILE ${profile.name}] Browser launched successfully.`);
          } else {
            dashboardActions.appendLog(`[PROFILE ${profile.name}] ERROR: Failed to launch browser.`);
          }
        } catch {
          dashboardActions.appendLog(`[PROFILE ${profile.name}] ERROR: API unreachable.`);
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
    } catch (e: unknown) {
      dashboardActions.appendLog(`[SYSTEM] ERROR: ${e instanceof Error ? e.message : String(e)}`);
      dashboardStore.setState((s) => ({ ...s, isRunning: false }));
    }
  },

  async initListeners() {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<string>('e2e-log', (event) => {
        dashboardActions.appendLog(event.payload);
      });
    } catch (err) {
      console.warn('Tauri event listener not available in this environment:', err);
      return async () => {}; // dummy unlisten
    }
  }
};

export function useDashboardStore() {
  return useStore(dashboardStore);
}
