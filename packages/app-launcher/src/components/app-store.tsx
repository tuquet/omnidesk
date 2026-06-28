import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@omnidesk/auth';
import { APP_REGISTRY } from '../config/registry';
import {
  launcherActions,
  useLauncherStore,
  useNonCoreInstalledApps,
} from '../stores/use-launcher-store';
import {
  useMarketplaceApps,
  useInstalledApps,
  useInstallApp,
  useUninstallApp,
  useLocalInstalledApps,
  type MarketplaceApp,
} from '../api/queries';
import { Button, Input, Skeleton, cn } from '@omnidesk/ui';
import { Search, AlertCircle, RefreshCw, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { APP_STORE_CATEGORIES } from '../config/constants';
import { AppCard } from './app-card';
import { FeaturedBanner } from './featured-banner';
import { UploadAppDialog } from './upload-app-dialog';

export function AppStore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { installedApps } = useLauncherStore();
  const nonCoreInstalledIds = useNonCoreInstalledApps();
  useAuth();
  const navigate = useNavigate();
  const {
    data: marketplaceApps,
    isLoading: isLoadingApps,
    error: appsError,
    refetch: refetchApps,
  } = useMarketplaceApps();

  const { data: serverInstalledApps, isLoading: isLoadingInstalled } = useInstalledApps();

  const installMutation = useInstallApp();
  const uninstallMutation = useUninstallApp();

  useEffect(() => {
    if (serverInstalledApps) {
      launcherActions.syncFromServer(serverInstalledApps);
    }
  }, [serverInstalledApps]);

  const { data: localApps } = useLocalInstalledApps();

  const apps: MarketplaceApp[] = useMemo(() => {
    const rawApps =
      marketplaceApps ??
      Object.values(APP_REGISTRY).map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        icon_name: app.icon.displayName ?? 'Box',
        category: app.category,
        is_core: app.isCore ?? false,
        sort_order: 0,
        created_at: new Date().toISOString(),
      }));

    // Merge local apps, overriding server apps if duplicate ID
    const merged = [...rawApps];
    if (localApps) {
      for (const localApp of localApps) {
        const idx = merged.findIndex((a) => a.id === localApp.id);
        if (idx >= 0) {
          merged[idx] = localApp;
        } else {
          merged.push(localApp);
        }
      }
    }

    return merged.filter((a) => !a.is_core);
  }, [marketplaceApps, localApps]);

  const handleInstall = useCallback(
    (appId: string, appName: string) => {
      launcherActions.installApp(appId);
      installMutation.mutate(appId, {
        onSuccess: async () => {
          toast.success(`Installed ${appName}!`, {
            description: 'The app is now available in your sidebar.',
          });
        },
        onError: () => {
          launcherActions.uninstallApp(appId);
        },
      });
    },
    [installMutation],
  );

  const handleUninstall = useCallback(
    (appId: string, appName: string) => {
      launcherActions.uninstallApp(appId);
      uninstallMutation.mutate(appId, {
        onSuccess: () =>
          toast.success(`Removed ${appName}`, {
            description: 'The app has been removed from your sidebar.',
          }),
        onError: () => {
          launcherActions.installApp(appId);
        },
      });
    },
    [uninstallMutation],
  );

  if (isLoadingApps || isLoadingInstalled) {
    return (
      <div className="flex flex-col gap-8 p-6 lg:p-10 w-full max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>
        <Skeleton className="h-[280px] w-full rounded-[2rem]" />
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-[340px] rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (appsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center h-[60vh]">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Cannot connect to App Store</h2>
          <p className="text-muted-foreground max-w-md">{appsError.message}</p>
        </div>
        <Button className="rounded-full px-8 mt-4" onClick={() => refetchApps()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const featuredApp = apps.find((a) => a.id === 'analytics') || apps[0];

  const searchFilteredApps = searchQuery.trim()
    ? apps.filter((app) => {
        const q = searchQuery.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q)
        );
      })
    : null;

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 px-6 py-4 lg:px-10 lg:pt-8 lg:pb-6 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">App Store</h1>
            <Button variant="outline" className="ml-4" onClick={() => setUploadDialogOpen(true)}>
              <CloudUpload className="mr-2 h-4 w-4" />
              Upload App
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 text-[15px] font-medium border-b border-transparent">
          <button
            onClick={() => setActiveTab('discover')}
            className={cn(
              'pb-2 border-b-2 transition-colors',
              activeTab === 'discover'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={cn(
              'pb-2 border-b-2 transition-colors',
              activeTab === 'installed'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Installed
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 mt-6 flex flex-col gap-12">
        {searchFilteredApps ? (
          // ─── SEARCH RESULTS ─────────────────────────────────────────────────
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold tracking-tight">Search Results</h2>
            {searchFilteredApps.length === 0 ? (
              <div className="text-muted-foreground py-10">No apps found for "{searchQuery}"</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0 px-2">
                {searchFilteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedApps.includes(app.id)}
                    isInstalling={installMutation.isPending && installMutation.variables === app.id}
                    isUninstalling={
                      uninstallMutation.isPending && uninstallMutation.variables === app.id
                    }
                    onInstall={() => handleInstall(app.id, app.name)}
                    onUninstall={() => handleUninstall(app.id, app.name)}
                    onClick={() => navigate({ to: '/' })}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'installed' ? (
          // ─── INSTALLED TAB ──────────────────────────────────────────────────
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Your Apps</h2>
              <span className="text-sm text-muted-foreground">
                {nonCoreInstalledIds.length} Apps
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0 px-2">
              {apps
                .filter((app) => nonCoreInstalledIds.includes(app.id))
                .map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={true}
                    isInstalling={false}
                    isUninstalling={
                      uninstallMutation.isPending && uninstallMutation.variables === app.id
                    }
                    onInstall={() => {}}
                    onUninstall={() => handleUninstall(app.id, app.name)}
                    onClick={() => navigate({ to: '/' })}
                  />
                ))}
            </div>
          </div>
        ) : (
          // ─── DISCOVER TAB ───────────────────────────────────────────────────
          <>
            {/* Featured Hero */}
            {featuredApp && (
              <FeaturedBanner
                app={featuredApp}
                isInstalled={installedApps.includes(featuredApp.id)}
                isInstalling={
                  installMutation.isPending && installMutation.variables === featuredApp.id
                }
                onInstall={() => handleInstall(featuredApp.id, featuredApp.name)}
                onClick={() => navigate({ to: '/' })}
              />
            )}

            {/* Horizontal Categories */}
            {APP_STORE_CATEGORIES.map((category) => {
              const categoryApps = apps.filter((app) => app.category === category);
              if (categoryApps.length === 0) return null;

              return (
                <div key={category} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Must-Have {category}</h2>
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      See All
                    </Button>
                  </div>

                  {/* Responsive Grid Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0 px-2">
                    {categoryApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        isInstalled={installedApps.includes(app.id)}
                        isInstalling={
                          installMutation.isPending && installMutation.variables === app.id
                        }
                        isUninstalling={
                          uninstallMutation.isPending && uninstallMutation.variables === app.id
                        }
                        onInstall={() => handleInstall(app.id, app.name)}
                        onUninstall={() => handleUninstall(app.id, app.name)}
                        onClick={() => navigate({ to: '/' })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* All other apps grid */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border/40">
              <h2 className="text-2xl font-bold tracking-tight">Top Apps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-0 px-2">
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    isInstalled={installedApps.includes(app.id)}
                    isInstalling={installMutation.isPending && installMutation.variables === app.id}
                    isUninstalling={
                      uninstallMutation.isPending && uninstallMutation.variables === app.id
                    }
                    onInstall={() => handleInstall(app.id, app.name)}
                    onUninstall={() => handleUninstall(app.id, app.name)}
                    onClick={() => navigate({ to: '/' })}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <UploadAppDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </div>
  );
}
