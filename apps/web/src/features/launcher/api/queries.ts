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

// ─── API Helpers ────────────────────────────────────────────────────────────
// The new Architecture routes through the Rust Backend API Gateway (port 1421)

const API_BASE = 'http://127.0.0.1:1421/api';

/**
 * Fetch JWT to pass to Axum backend.
 */
async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export function useMarketplaceApps() {
  return useQuery({
    queryKey: launcherKeys.marketplaceApps(),
    queryFn: async (): Promise<MarketplaceApp[]> => {
      // Dùng Supabase Anonymous call có thể làm trực tiếp vì nó public,
      // Nhưng để chuẩn API Gateway thì mình fetch qua Rust.
      // Tuy nhiên nếu endpoint GET /api/apps không có auth thì không cần JWT.
      const res = await fetch(`${API_BASE}/apps`);
      if (!res.ok) throw new Error('Failed to fetch apps from gateway');

      const data: unknown = await res.json();
      return z.array(marketplaceAppSchema).parse(data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstalledApps() {
  return useQuery({
    queryKey: launcherKeys.installedApps(),
    queryFn: async (): Promise<string[]> => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/apps/installed`, { headers });

      if (!res.ok) throw new Error('Failed to fetch installed apps');

      const data: unknown = await res.json();
      // Data expected to be string[]
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
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/apps/installed-details`, { headers });

      if (!res.ok) throw new Error('Failed to fetch installed apps details');

      const data: unknown = await res.json();
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
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/apps/install/${appId}`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown Error');
        throw new Error(`Failed to install app: ${errorText}`);
      }
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
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/apps/install/${appId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown Error');
        throw new Error(`Failed to uninstall app: ${errorText}`);
      }
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
