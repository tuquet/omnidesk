import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const marketplaceAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon_name: z.string(),
  category: z.enum(['Core', 'Productivity', 'Analytics', 'Development', 'Utilities']),
  is_core: z.boolean(),
  sort_order: z.number(),
  created_at: z.string(),
});

export type MarketplaceApp = z.infer<typeof marketplaceAppSchema>;

const userInstalledAppSchema = z.object({
  user_id: z.string(),
  app_id: z.string(),
  installed_at: z.string(),
});

export type UserInstalledApp = z.infer<typeof userInstalledAppSchema>;

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const launcherKeys = {
  all: ['launcher'] as const,
  marketplaceApps: () => [...launcherKeys.all, 'marketplace-apps'] as const,
  installedApps: () => [...launcherKeys.all, 'installed-apps'] as const,
} as const;

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch all available apps from the marketplace.
 * Falls back to empty array on error.
 */
export function useMarketplaceApps() {
  return useQuery({
    queryKey: launcherKeys.marketplaceApps(),
    queryFn: async (): Promise<MarketplaceApp[]> => {
      const { data, error } = await supabase
        .from('marketplace_apps')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Validate at runtime with Zod
      return z.array(marketplaceAppSchema).parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — app registry doesn't change often
  });
}

/**
 * Fetch the current user's installed app IDs.
 * Returns an array of app_id strings for easy lookup.
 */
export function useInstalledApps() {
  return useQuery({
    queryKey: launcherKeys.installedApps(),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('user_installed_apps')
        .select('app_id');

      if (error) throw error;

      return z.array(z.object({ app_id: z.string() }))
        .parse(data)
        .map((row) => row.app_id);
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Install an app for the current user.
 * Optimistically updates the installed apps cache.
 */
export function useInstallApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_installed_apps')
        .insert({ user_id: user.id, app_id: appId });

      if (error) throw error;
    },
    // Optimistic update
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey: launcherKeys.installedApps() });

      const previousApps = queryClient.getQueryData<string[]>(launcherKeys.installedApps());

      queryClient.setQueryData<string[]>(
        launcherKeys.installedApps(),
        (old) => [...(old ?? []), appId],
      );

      return { previousApps };
    },
    onError: (_err, _appId, context) => {
      // Rollback on error
      if (context?.previousApps) {
        queryClient.setQueryData(launcherKeys.installedApps(), context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.installedApps() });
    },
  });
}

/**
 * Uninstall an app for the current user.
 * Optimistically removes from the installed apps cache.
 */
export function useUninstallApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_installed_apps')
        .delete()
        .eq('user_id', user.id)
        .eq('app_id', appId);

      if (error) throw error;
    },
    // Optimistic update
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey: launcherKeys.installedApps() });

      const previousApps = queryClient.getQueryData<string[]>(launcherKeys.installedApps());

      queryClient.setQueryData<string[]>(
        launcherKeys.installedApps(),
        (old) => (old ?? []).filter((id) => id !== appId),
      );

      return { previousApps };
    },
    onError: (_err, _appId, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(launcherKeys.installedApps(), context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.installedApps() });
    },
  });
}
