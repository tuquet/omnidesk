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
}

export const browserProfileStore = new Store<BrowserProfileState>({
  profiles: [],
  isLoading: false,
});

import { toast } from 'sonner';

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
    const errorMsg = `API error: ${response.status} ${response.statusText}`;
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return null as unknown as T;
}

export function useBrowserProfileStore() {
  const state = useStore(browserProfileStore);

  const fetchProfiles = useCallback(async (sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true }));
    let url = '/api/browser-profiles';
    if (sortBy) {
      url += `?sort_by=${sortBy}&sort_order=${sortOrder || 'desc'}`;
    }
    const profiles = await fetchApi<BrowserProfile[]>(url).finally(() => {
      browserProfileStore.setState((s) => ({ ...s, isLoading: false }));
    });
    browserProfileStore.setState((s) => ({ ...s, profiles }));
  }, []);

  const createProfile = async (payload: CreateBrowserProfilePayload) => {
    const newProfile = await fetchApi<BrowserProfile>('/api/browser-profiles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    browserProfileStore.setState((s) => ({
      ...s,
      profiles: [newProfile, ...s.profiles],
    }));
  };

  const updateProfile = async (payload: UpdateBrowserProfilePayload) => {
    const updatedProfile = await fetchApi<BrowserProfile>(`/api/browser-profiles/${payload.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    browserProfileStore.setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === payload.id ? updatedProfile : p)),
    }));
  };

  const deleteProfile = async (id: string) => {
    await fetchApi(`/api/browser-profiles/${id}`, { method: 'DELETE' });
    browserProfileStore.setState((s) => ({
      ...s,
      profiles: s.profiles.filter((p) => p.id !== id),
    }));
  };

  const launchProfile = async (id: string, payload: Record<string, unknown> = {}) => {
    await fetchApi(`/api/browser-profiles/${id}/launch`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Optionally update local status optimistically
    browserProfileStore.setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, status: 'RUNNING', pid: 1 } : p)),
    }));
  };

  const stopProfile = async (id: string) => {
    await fetchApi(`/api/browser-profiles/${id}/stop`, { method: 'POST' });
    // Update local status optimistically
    browserProfileStore.setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, status: 'IDLE', pid: null } : p)),
    }));
  };

  const resetBrowserEngine = async () => {
    await fetchApi(`/api/browser-profiles/browser-engine`, { method: 'DELETE' });
  };

  const fetchAvailableVersions = async (browserType: string) => {
    return fetchApi<{ browser_version: string; executable_path: string }[]>(
      `/api/browser-profiles/available-versions?browser_type=${browserType}`,
    );
  };

  const fetchEngineStatus = async (browserType: string, version?: string) => {
    const qs = new URLSearchParams({ browser_type: browserType });
    if (version) qs.set('version', version);
    return fetchApi<{ is_downloaded: boolean; exe_path: string | null }>(
      `/api/browser-profiles/engine-status?${qs.toString()}`,
    );
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
