import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type Role = 'GUEST' | 'USER' | 'ADMIN';

export interface AuthState {
  role: Role;
  session: Session | null;
  user: User | null;
  displayName: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  role: 'GUEST',
  session: null,
  user: null,
  displayName: null,
  isLoading: true, // true until first auth check completes
};

export const authStore = new Store<AuthState>(initialState);

/**
 * Derive role from Supabase user metadata.
 * app_metadata is safe for authorization (not user-editable).
 */
function deriveRole(user: User | null): Role {
  if (!user) return 'GUEST';
  // Anonymous users have is_anonymous flag
  if (user.is_anonymous) return 'GUEST';
  // Check app_metadata for admin role (set by Supabase Dashboard or Edge Function)
  const appMeta = user.app_metadata;
  if (appMeta?.role === 'ADMIN') return 'ADMIN';
  return 'USER';
}

function deriveDisplayName(user: User | null): string | null {
  if (!user) return null;
  if (user.is_anonymous) return 'Guest';
  // Try user_metadata for display purposes (not auth decisions)
  const meta = user.user_metadata;
  return meta?.full_name || meta?.name || meta?.preferred_username || user.email || null;
}

function syncAuthState(session: Session | null) {
  const user = session?.user ?? null;
  authStore.setState(() => ({
    role: deriveRole(user),
    session,
    user,
    displayName: deriveDisplayName(user),
    isLoading: false,
  }));
}

export const authActions = {
  /** Sign in with email and password */
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // State will be updated by onAuthStateChange listener
    return data;
  },

  /** Sign in with GitHub OAuth */
  signInWithGitHub: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  /** Sign in anonymously (Guest mode) */
  signInAnonymously: async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  },

  /** Sign up with email and password */
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  /** Sign out */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // State will be updated by onAuthStateChange listener
  },

  /** Initialize auth — call once on app mount */
  initialize: async () => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    syncAuthState(session);

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncAuthState(session);
      },
    );

    return subscription;
  },
};

/**
 * Hook to use auth state anywhere in the app.
 *
 * @example
 * ```tsx
 * const { role, isGuest, isAuthenticated, displayName } = useAuth();
 * ```
 */
export function useAuth() {
  const state = useStore(authStore);

  return {
    ...state,
    isGuest: state.role === 'GUEST' && !state.user?.is_anonymous,
    isAnonymous: state.user?.is_anonymous ?? false,
    isUser: state.role === 'USER',
    isAdmin: state.role === 'ADMIN',
    isAuthenticated: state.session !== null,
    isLoading: state.isLoading,
  };
}
