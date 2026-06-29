import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import { useCallback } from 'react';
import { PROFILE_API_URL } from '@omnidesk/core';

export interface BrowserProfile {
  id: string;
  name: string;
  group_id: string | null;
  os: string | null;
  browser_type: string | null;
  data_dir_path: string;
  status: string | null;
  last_used_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  pid?: number | null;
  browser_version?: string | null;
}

export interface CreateBrowserProfilePayload {
  user_agent?: string | null;
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  executable_path?: string | null;
  browser_version?: string | null;
}

export interface UpdateBrowserProfilePayload {
  id: string;
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
  proxy?: string | null;
  tags?: string | null;
  notes?: string | null;
  executable_path?: string | null;
  browser_version?: string | null;
}

interface BrowserProfileState {
  profiles: BrowserProfile[];
  isLoading: boolean;
  error: string | null;
}

export const browserProfileStore = new Store<BrowserProfileState>({
  profiles: [],
  isLoading: false,
  error: null,
});

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('omnidesk_token') || '';
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${PROFILE_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return null as unknown as T;
}

export function useBrowserProfileStore() {
  const state = useStore(browserProfileStore);

  const fetchProfiles = useCallback(async () => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const profiles = await fetchApi<BrowserProfile[]>('/api/browser-profiles');
      browserProfileStore.setState((s) => ({ ...s, profiles, isLoading: false }));
    } catch (e) {
      browserProfileStore.setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : String(e),
        isLoading: false,
      }));
    }
  }, []);

  const createProfile = async (payload: CreateBrowserProfilePayload) => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      const newProfile = await fetchApi<BrowserProfile>('/api/browser-profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: [newProfile, ...s.profiles],
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const updateProfile = async (payload: UpdateBrowserProfilePayload) => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      const updatedProfile = await fetchApi<BrowserProfile>(`/api/browser-profiles/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === payload.id ? updatedProfile : p)),
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const deleteProfile = async (id: string) => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/${id}`, { method: 'DELETE' });
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.filter((p) => p.id !== id),
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const launchProfile = async (id: string, payload: Record<string, unknown> = {}) => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/${id}/launch`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Optionally update local status optimistically
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === id ? { ...p, status: 'RUNNING', pid: 1 } : p)),
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const stopProfile = async (id: string) => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/${id}/stop`, { method: 'POST' });
      // Update local status optimistically
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.map((p) => (p.id === id ? { ...p, status: 'IDLE', pid: null } : p)),
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const resetBrowserEngine = async () => {
    browserProfileStore.setState((s) => ({ ...s, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/browser-engine`, { method: 'DELETE' });
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr }));
      throw new Error(errStr);
    }
  };

  const fetchAvailableVersions = async (browserType: string) => {
    try {
      return await fetchApi<{ browser_version: string; executable_path: string }[]>(
        `/api/browser-profiles/available-versions?browser_type=${browserType}`,
      );
    } catch (e) {
      console.error('Failed to fetch versions', e);
      return [];
    }
  };

  const fetchEngineStatus = async (browserType: string, version?: string) => {
    try {
      const qs = new URLSearchParams({ browser_type: browserType });
      if (version) qs.set('version', version);
      return await fetchApi<{ is_downloaded: boolean; exe_path: string | null }>(
        `/api/browser-profiles/engine-status?${qs.toString()}`,
      );
    } catch (e) {
      console.error('Failed to fetch engine status', e);
      return { is_downloaded: false, exe_path: null };
    }
  };

  return {
    ...state,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    launchProfile,
    stopProfile,
    resetBrowserEngine,
    fetchAvailableVersions,
    fetchEngineStatus,
  };
}
