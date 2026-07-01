import { useStore } from '@tanstack/react-store';
import { STORAGE_KEYS } from '@omnidesk/types';
import { createPersistentStore } from './utils';

export interface LayoutState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  panelSizes: number[];
}

export const layoutStore = createPersistentStore<LayoutState>(STORAGE_KEYS.LAYOUT, {
  sidebarOpen: false,
  theme: 'system',
  panelSizes: [20, 80],
});

// Always default to false on app load, regardless of localStorage
layoutStore.setState((state) => ({ ...state, sidebarOpen: false }));

export const layoutActions = {
  setSidebarOpen: (open: boolean | ((val: boolean) => boolean)) => {
    layoutStore.setState((state) => ({
      ...state,
      sidebarOpen: typeof open === 'function' ? open(state.sidebarOpen) : open,
    }));
  },
  toggleSidebar: () => {
    layoutStore.setState((state) => ({ ...state, sidebarOpen: !state.sidebarOpen }));
  },
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    layoutStore.setState((state) => ({ ...state, theme }));
  },
  setPanelSizes: (sizes: number[]) => {
    layoutStore.setState((state) => ({ ...state, panelSizes: sizes }));
  },
};

export function useLayoutStore() {
  const state = useStore(layoutStore);
  return {
    ...state,
    ...layoutActions,
  };
}
