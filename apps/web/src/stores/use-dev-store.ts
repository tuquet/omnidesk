import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';

const STORAGE_KEY = 'omnidesk:dev-mode';

export interface DevState {
  isDevMode: boolean;
}

// Read initial state from localStorage
const getInitialState = (): DevState => {
  if (typeof window === 'undefined') return { isDevMode: false };
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return { isDevMode: item === 'true' };
  } catch {
    return { isDevMode: false };
  }
};

export const devStore = new Store<DevState>(getInitialState());

export const devActions = {
  setDevMode: (enabled: boolean) => {
    devStore.setState(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(enabled));
      } catch (e) {
        // Ignore
      }
      return { isDevMode: enabled };
    });
  },
  toggleDevMode: () => {
    devStore.setState((state) => {
      const newValue = !state.isDevMode;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(newValue));
      } catch (e) {
        // Ignore
      }
      return { isDevMode: newValue };
    });
  },
};

export function useDevStore() {
  const isDevMode = useStore(devStore, (state) => state.isDevMode);
  return {
    isDevMode,
    ...devActions,
  };
}
