import { Store } from '@tanstack/store';
import { useStore } from '@tanstack/react-store';
import { supabase } from '@omnidesk/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { PlatformAdapter, Role } from '@omnidesk/types';
import { ROLES } from '@omnidesk/types';
import { toast } from 'sonner';
export type { Role };
export { ROLES };

export interface AuthState {
  role: Role;
  session: Session | null;
  user: User | null;
  displayName: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  role: ROLES.GUEST,
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
  if (!user) return ROLES.GUEST;
  // Anonymous users have is_anonymous flag
  if (user.is_anonymous) return ROLES.GUEST;
  // Check app_metadata for admin role (set by Supabase Dashboard or Edge Function)
  const appMeta = user.app_metadata;
  if (appMeta?.role === ROLES.ADMIN) return ROLES.ADMIN;
  return ROLES.USER;
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
    if (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
    // State will be updated by onAuthStateChange listener
    return data;
  },

  /** Sign in with GitHub OAuth */
  signInWithGitHub: async (platformApi: PlatformAdapter) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: platformApi.getOAuthRedirectUrl(),
        skipBrowserRedirect: platformApi.isOAuthSkipBrowserRedirect(),
      },
    });
    if (error) {
      toast.error(error.message || 'GitHub login failed');
      throw error;
    }
    
    // If the platform skipped the browser redirect (e.g. desktop native auth flow),
    // we must manually open the URL using the platform's API
    if (platformApi.isOAuthSkipBrowserRedirect() && data.url) {
      await platformApi.openUrl(data.url).catch(() => {});
    }
    
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
    if (error) {
      toast.error(error.message || 'Sign up failed');
      throw error;
    }
    return data;
  },

  /** Sign out */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message || 'Logout failed');
      throw error;
    }
    // State will be updated by onAuthStateChange listener
  },

  /** Initialize auth — call once on app mount */
  initialize: async () => {
    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    syncAuthState(session);

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      syncAuthState(session);
    });

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
    isGuest: state.role === ROLES.GUEST && !state.user?.is_anonymous,
    isAnonymous: state.user?.is_anonymous ?? false,
    isUser: state.role === ROLES.USER,
    isAdmin: state.role === ROLES.ADMIN,
    isAuthenticated: state.session !== null,
    isLoading: state.isLoading,
  };
}
