import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface BrowserProfile {
  id: string;
  name: string;
  browser_type: string;
  executable_path: string | null;
  proxy: string | null;
  user_agent: string | null;
  fingerprint_config: string | null;
  data_dir_path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrowserProfilePayload {
  name: string;
  browser_type: string;
  executable_path: string | null;
  proxy: string | null;
  user_agent: string | null;
  fingerprint_config: string | null;
  data_dir_path: string;
}

export interface UpdateBrowserProfilePayload {
  id: string;
  name: string;
  browser_type: string;
  executable_path: string | null;
  proxy: string | null;
  user_agent: string | null;
  fingerprint_config: string | null;
  data_dir_path: string;
}

interface BrowserProfileState {
  profiles: BrowserProfile[];
  isLoading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
  createProfile: (payload: CreateBrowserProfilePayload) => Promise<void>;
  updateProfile: (payload: UpdateBrowserProfilePayload) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

export const useBrowserProfileStore = create<BrowserProfileState>((set, get) => ({
  profiles: [],
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await invoke<BrowserProfile[]>('get_browser_profiles');
      set({ profiles, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), isLoading: false });
    }
  },

  createProfile: async (payload: CreateBrowserProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const newProfile = await invoke<BrowserProfile>('create_browser_profile', { payload });
      set((state) => ({ 
        profiles: [newProfile, ...state.profiles],
        isLoading: false 
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      set({ error: errStr, isLoading: false });
      throw new Error(errStr);
    }
  },

  updateProfile: async (payload: UpdateBrowserProfilePayload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProfile = await invoke<BrowserProfile>('update_browser_profile', { payload });
      set((state) => ({
        profiles: state.profiles.map(p => p.id === payload.id ? updatedProfile : p),
        isLoading: false
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      set({ error: errStr, isLoading: false });
      throw new Error(errStr);
    }
  },

  deleteProfile: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_browser_profile', { id });
      set((state) => ({
        profiles: state.profiles.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (e) {
      const errStr = e instanceof Error ? e.message : String(e);
      set({ error: errStr, isLoading: false });
      throw new Error(errStr);
    }
  }
}));
