import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';

export type Role = 'GUEST' | 'USER' | 'ADMIN';

export interface AuthState {
  role: Role;
  token: string | null;
  displayName: string | null;
}

export const authStore = new Store<AuthState>({
  role: 'GUEST',
  token: localStorage.getItem('kbm-auth-token'),
  displayName: localStorage.getItem('kbm-display-name'),
});

export const authActions = {
  setAuth: (role: Role, token: string | null, displayName?: string) => {
    if (token) localStorage.setItem('kbm-auth-token', token);
    if (displayName) localStorage.setItem('kbm-display-name', displayName);
    authStore.setState(() => ({ role, token, displayName: displayName ?? null }));
  },
  loginAsGuest: () => {
    authStore.setState(() => ({ role: 'GUEST', token: null, displayName: 'Guest' }));
  },
  logout: () => {
    localStorage.removeItem('kbm-auth-token');
    localStorage.removeItem('kbm-display-name');
    authStore.setState(() => ({ role: 'GUEST', token: null, displayName: null }));
  },
};

/**
 * Hook để sử dụng auth state ở bất cứ đâu trong app.
 *
 * @example
 * ```tsx
 * const { role, isGuest, isAuthenticated, displayName } = useAuth();
 *
 * if (isGuest) {
 *   // Hiện banner mời đăng nhập
 * }
 * ```
 */
export function useAuth() {
  const state = useStore(authStore);

  return {
    ...state,
    isGuest: state.role === 'GUEST',
    isUser: state.role === 'USER',
    isAdmin: state.role === 'ADMIN',
    isAuthenticated: state.role !== 'GUEST',
  };
}
