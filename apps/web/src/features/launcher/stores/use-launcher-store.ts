import { Store } from '@tanstack/react-store';
import { useStore } from '@tanstack/react-store';
import { APP_REGISTRY } from '../config/registry';

// Get default installed apps (core apps are always installed)
const defaultInstalledApps = Object.values(APP_REGISTRY)
  .filter((app) => app.isCore)
  .map((app) => app.id);

export interface LauncherState {
  /** List of installed app IDs */
  installedApps: string[];
  /** Whether the store has been synced with server data */
  isSynced: boolean;
}

// Ensure Core Apps are always in the installed list
const enforceCoreApps = (apps: string[]) => {
  const coreApps = Object.values(APP_REGISTRY)
    .filter((a) => a.isCore)
    .map((a) => a.id);
  const combined = new Set([...apps, ...coreApps]);
  return Array.from(combined);
};

// Initialize from localStorage if available (offline-first fallback)
const loadState = (): LauncherState => {
  try {
    const stored = localStorage.getItem('omnidesk-launcher-state');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        installedApps: enforceCoreApps(parsed.installedApps || []),
        isSynced: false,
      };
    }
  } catch (e) {
    console.error('Failed to load launcher state', e);
  }
  return { installedApps: defaultInstalledApps, isSynced: false };
};

export const launcherStore = new Store<LauncherState>(loadState());

// Subscribe to state changes and persist to localStorage (offline fallback)
launcherStore.subscribe(() => {
  try {
    localStorage.setItem(
      'omnidesk-launcher-state',
      JSON.stringify({
        installedApps: launcherStore.state.installedApps,
      }),
    );
  } catch (e) {
    console.error('Failed to save launcher state', e);
  }
});

export const launcherActions = {
  /**
   * Sync store with server data from TanStack Query.
   * Called when useInstalledApps() query resolves.
   */
  syncFromServer: (serverApps: string[]) => {
    launcherStore.setState((state) => ({
      ...state,
      installedApps: enforceCoreApps(serverApps),
      isSynced: true,
    }));
  },

  /**
   * Optimistically install an app (UI updates immediately).
   * The actual server mutation is handled by useInstallApp() query hook.
   */
  installApp: (appId: string) => {
    launcherStore.setState((state) => {
      if (state.installedApps.includes(appId)) return state;
      return {
        ...state,
        installedApps: [...state.installedApps, appId],
      };
    });
  },

  /**
   * Optimistically uninstall an app (UI updates immediately).
   * Core apps cannot be uninstalled.
   */
  uninstallApp: (appId: string) => {
    const app = APP_REGISTRY[appId];
    if (app?.isCore) return;

    launcherStore.setState((state) => ({
      ...state,
      installedApps: state.installedApps.filter((id) => id !== appId),
    }));
  },

  /**
   * Check if an app is currently installed.
   */
  isInstalled: (appId: string) => {
    return launcherStore.state.installedApps.includes(appId);
  },
};

/**
 * Hook to use launcher state reactively.
 */
export function useLauncherStore() {
  return useStore(launcherStore);
}
