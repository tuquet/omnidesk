import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { client } from '@/lib/api-client';

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
  current_version: z.string().optional(),
  download_url: z.string().nullable().optional(),
});

export type MarketplaceApp = z.infer<typeof marketplaceAppSchema>;

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const launcherKeys = {
  all: ['launcher'] as const,
  marketplaceApps: () => [...launcherKeys.all, 'marketplace-apps'] as const,
  installedApps: () => [...launcherKeys.all, 'installed-apps'] as const,
} as const;

// ─── Queries ────────────────────────────────────────────────────────────────

export function useMarketplaceApps() {
  return useQuery({
    queryKey: launcherKeys.marketplaceApps(),
    queryFn: async (): Promise<MarketplaceApp[]> => {
      const { data } = await client.get({
        url: '/api/apps',
      });
      return z.array(marketplaceAppSchema).parse(data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocalInstalledApps() {
  return useQuery({
    queryKey: [...launcherKeys.all, 'local-installed-apps'] as const,
    queryFn: async (): Promise<MarketplaceApp[]> => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const localApps = await invoke<any[]>('list_local_apps');
        return localApps.map((app: any) => ({
          id: app.id,
          name: app.name || 'Unknown App',
          description: app.description || '',
          icon_name: app.icon || 'Box',
          category: app.category || 'Utilities',
          is_core: false,
          sort_order: 999,
          created_at: new Date().toISOString(),
          current_version: app.version || '1.0.0',
        }));
      } catch (e) {
        console.warn('Tauri not available or list_local_apps failed:', e);
        return [];
      }
    },
    staleTime: 5000,
  });
}

export function useInstalledApps() {
  return useQuery({
    queryKey: launcherKeys.installedApps(),
    queryFn: async (): Promise<string[]> => {
      const { data } = await client.get({
        url: '/api/apps/installed',
      });
      return z.array(z.string()).parse(data);
    },
    staleTime: 60 * 1000,
  });
}

const installedAppDetailsSchema = z.object({
  app_id: z.string(),
  version: z.string(),
});

export type InstalledAppDetails = z.infer<typeof installedAppDetailsSchema>;

export function useInstalledAppsDetails() {
  return useQuery({
    queryKey: [...launcherKeys.all, 'installed-apps-details'] as const,
    queryFn: async (): Promise<InstalledAppDetails[]> => {
      const { data } = await client.get({
        url: '/api/apps/installed-details',
      });
      return z.array(installedAppDetailsSchema).parse(data);
    },
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useInstallApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      await client.post({
        url: `/api/apps/install/${appId}`,
      });
    },
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey: launcherKeys.installedApps() });
      const previousApps = queryClient.getQueryData<string[]>(launcherKeys.installedApps());
      queryClient.setQueryData<string[]>(launcherKeys.installedApps(), (old) => [
        ...(old ?? []),
        appId,
      ]);
      return { previousApps };
    },
    onError: (_err, _appId, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(launcherKeys.installedApps(), context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.all });
    },
  });
}

export function useUninstallApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      await client.delete({
        url: `/api/apps/install/${appId}`,
      });
    },
    onMutate: async (appId) => {
      await queryClient.cancelQueries({ queryKey: launcherKeys.installedApps() });
      const previousApps = queryClient.getQueryData<string[]>(launcherKeys.installedApps());
      queryClient.setQueryData<string[]>(launcherKeys.installedApps(), (old) =>
        (old ?? []).filter((id) => id !== appId),
      );
      return { previousApps };
    },
    onError: (_err, _appId, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(launcherKeys.installedApps(), context.previousApps);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.all });
    },
  });
}
