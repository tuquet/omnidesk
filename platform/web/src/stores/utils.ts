import { Store } from '@tanstack/store';

export function createPersistentStore<T>(
  key: string,
  initialState: T
): Store<T> {
  // Load from localStorage if available
  let savedState: T | null = null;
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        savedState = JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`Failed to parse localStorage item for key "${key}"`, error);
    }
  }

  const store = new Store<T>(savedState ?? initialState);

  // Subscribe to changes and save to localStorage
  if (typeof window !== 'undefined') {
    store.subscribe(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(store.state));
      } catch (error) {
        console.warn(`Failed to save store state to localStorage for key "${key}"`, error);
      }
    });

    // Listen for storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue) as T;
          store.setState((oldState) => ({ ...oldState, ...newState }));
        } catch (error) {
          console.warn(`Failed to parse storage event for key "${key}"`, error);
        }
      }
    });
  }

  return store;
}
