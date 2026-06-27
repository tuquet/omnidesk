import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '')) as string || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '')) as string || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

import type { SupabaseClient } from '@supabase/supabase-js';

// Mock client to prevent crashes during startup when ENV vars are missing
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
  },
} as unknown as SupabaseClient;

if (!isSupabaseConfigured) {
  console.warn(
    '[Environment] Connection variables are missing. Check your .env file.\n' +
      'Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY',
  );
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;

/**
 * Get the current Supabase session (cached, no network call).
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current authenticated user (verifies with Supabase server).
 * Use getSession() for cached reads, this for server-verified reads.
 */
export async function getUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
