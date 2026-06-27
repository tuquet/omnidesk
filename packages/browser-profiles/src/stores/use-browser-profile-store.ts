import { API_BASE_URL } from '@omnidesk/core';
import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';

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
}

export interface CreateBrowserProfilePayload {
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
}

export interface UpdateBrowserProfilePayload {
  id: string;
  name: string;
  browser_type?: string | null;
  data_dir_path: string;
  group_id?: string | null;
  os?: string | null;
  status?: string | null;
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

// BASE_URL imported from @omnidesk/core as API_BASE_URL

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('omnidesk_token') || '';
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null as any;
}

export function useBrowserProfileStore() {
  const state = useStore(browserProfileStore);

  const fetchProfiles = async () => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const profiles = await fetchApi<BrowserProfile[]>('/api/browser-profiles');
      browserProfileStore.setState((s) => ({ ...s, profiles, isLoading: false }));
    } catch (e) {
      browserProfileStore.setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), isLoading: false }));
    }
  };

  const createProfile = async (payload: CreateBrowserProfilePayload) => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const newProfile = await fetchApi<BrowserProfile>('/api/browser-profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      browserProfileStore.setState((s) => ({ 
        ...s,
        profiles: [newProfile, ...s.profiles],
        isLoading: false 
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr, isLoading: false }));
      throw new Error(errStr);
    }
  };

  const updateProfile = async (payload: UpdateBrowserProfilePayload) => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const updatedProfile = await fetchApi<BrowserProfile>(`/api/browser-profiles/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.map(p => p.id === payload.id ? updatedProfile : p),
        isLoading: false
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr, isLoading: false }));
      throw new Error(errStr);
    }
  };

  const deleteProfile = async (id: string) => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/${id}`, { method: 'DELETE' });
      browserProfileStore.setState((s) => ({
        ...s,
        profiles: s.profiles.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr, isLoading: false }));
      throw new Error(errStr);
    }
  };

  const launchProfile = async (id: string) => {
    browserProfileStore.setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      await fetchApi(`/api/browser-profiles/${id}/launch`, { method: 'POST' });
      browserProfileStore.setState((s) => ({ ...s, isLoading: false }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      browserProfileStore.setState((s) => ({ ...s, error: errStr, isLoading: false }));
      throw new Error(errStr);
    }
  };

  return {
    ...state,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    launchProfile,
  };
}
