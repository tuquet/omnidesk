import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';

export interface DevState {
  isDevMode: boolean;
}

// Initialize to false by default for every new session
const getInitialState = (): DevState => ({ isDevMode: false });

export const devStore = new Store<DevState>(getInitialState());

export const devActions = {
  setDevMode: (enabled: boolean) => {
    devStore.setState(() => ({ isDevMode: enabled }));
  },
  toggleDevMode: () => {
    devStore.setState((state) => ({ isDevMode: !state.isDevMode }));
  },
};

export function useDevStore() {
  const isDevMode = useStore(devStore, (state) => state.isDevMode);
  return {
    isDevMode,
    ...devActions,
  };
}
