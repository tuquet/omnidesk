import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/stores/use-auth-store';
import { APP_REGISTRY } from '../config/registry';
import { launcherActions, useLauncherStore } from '../stores/use-launcher-store';
import {
  useMarketplaceApps,
  useInstalledApps,
  useInstallApp,
  useUninstallApp,
  type MarketplaceApp,
} from '../api/queries';
import { Button, Input, Skeleton, cn } from '@omnidesk/ui';
import { Search, Package, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

// ─── App Card Component (macOS Style) ────────────────────────────────────────

interface AppCardProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  isInstalling: boolean;
  isUninstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onClick: () => void;
}

function AppCard({
  app,
  isInstalled,
  isInstalling,
  isUninstalling,
  onInstall,
  onUninstall,
  onClick,
}: AppCardProps) {
  const localApp = APP_REGISTRY[app.id];
  const Icon = localApp?.icon || Package;

  return (
    <div
      className="group relative flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer w-full max-w-[340px] shrink-0 snap-start"
      onClick={onClick}
    >
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[1.2rem] border shadow-sm bg-background transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-8 w-8 text-foreground/70" />
      </div>

      <div className="flex flex-col min-w-0 flex-1 justify-center py-1">
        <h3 className="text-[15px] font-medium leading-tight truncate text-foreground flex items-center gap-1.5">
          {app.name}
          {app.is_core && <Shield className="h-3 w-3 text-muted-foreground" />}
        </h3>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">{app.description}</p>
        <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-1">
          {app.category}
        </p>
      </div>

      <div className="flex shrink-0 items-center pl-2" onClick={(e) => e.stopPropagation()}>
        {isInstalled ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 rounded-full px-4 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted-foreground/20 hover:text-foreground transition-colors group/btn"
            disabled={isUninstalling || app.is_core}
            onClick={onUninstall}
          >
            {isUninstalling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span className="inline group-hover/btn:hidden">OPEN</span>
                <span className="hidden group-hover/btn:inline">
                  {app.is_core ? 'CORE' : 'REMOVE'}
                </span>
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 rounded-full px-4 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20"
            disabled={isInstalling}
            onClick={onInstall}
          >
            {isInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'GET'}
          </Button>
        )}
      </div>

      {/* Subtle bottom separator for list view */}
      <div className="absolute bottom-0 right-0 left-[104px] h-[1px] bg-border/40 group-hover:bg-transparent transition-colors" />
    </div>
  );
}

interface FeaturedBannerProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (e: React.MouseEvent) => void;
  onClick: () => void;
}

function FeaturedBanner({
  app,
  isInstalled,
  isInstalling,
  onInstall,
  onClick,
}: FeaturedBannerProps) {
  const localApp = APP_REGISTRY[app.id];
  const Icon = localApp?.icon || Package;

  return (
    <div
      className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-muted/50 via-muted/20 to-background p-8 sm:p-10 cursor-pointer border border-primary/5 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/10"
      onClick={onClick}
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.8rem] bg-background shadow-lg border transition-transform duration-500 group-hover:scale-105">
          <Icon className="h-12 w-12 text-primary" />
        </div>

        <div className="flex flex-col flex-1 text-center sm:text-left max-w-xl">
          <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">
            Editor's Choice
          </div>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">{app.name}</h2>
          <p className="text-muted-foreground text-base line-clamp-2 mb-6">{app.description}</p>

          <div
            className="flex items-center justify-center sm:justify-start gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isInstalled ? (
              <Button
                className="rounded-full px-8 font-semibold shadow-sm"
                variant="secondary"
                disabled
              >
                Installed
              </Button>
            ) : (
              <Button
                className="rounded-full px-8 font-semibold shadow-sm"
                onClick={onInstall}
                disabled={isInstalling}
              >
                {isInstalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                GET
              </Button>
            )}
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {app.category}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AppStore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const { installedApps } = useLauncherStore();
  const { user } = useAuth();
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
    return rawApps.filter((a) => !a.is_core);
  }, [marketplaceApps]);

  const handleInstall = useCallback(
    (appId: string, appName: string) => {
      launcherActions.installApp(appId);
      installMutation.mutate(appId, {
        onSuccess: async () => {
          toast.success(`Installed ${appName}!`, {
            description: 'The app is now available in your sidebar.',
          });
          if (user) {
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: `App Installed: ${appName}`,
              description: `You have successfully installed ${appName}. It is ready to use.`,
              type: 'success',
              action_url: `/app-store/${appId}`,
            });
          }
        },
        onError: (err) => {
          launcherActions.uninstallApp(appId);
          toast.error(`Failed to install ${appName}`, {
            description: err.message,
          });
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
        onError: (err) => {
          launcherActions.installApp(appId);
          toast.error(`Failed to remove ${appName}`, {
            description: err.message,
          });
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

  // Determine App Categories
  const categoriesToRender = ['Productivity', 'Utilities', 'Development'];
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
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
                    onClick={() => navigate({ to: '/app-store/$appId', params: { appId: app.id } })}
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
              <span className="text-sm text-muted-foreground">{installedApps.length} Apps</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
              {apps
                .filter((app) => installedApps.includes(app.id))
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
                    onClick={() => navigate({ to: '/app-store/$appId', params: { appId: app.id } })}
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
                onClick={() =>
                  navigate({ to: '/app-store/$appId', params: { appId: featuredApp.id } })
                }
              />
            )}

            {/* Horizontal Categories */}
            {categoriesToRender.map((category) => {
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
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
                        onClick={() =>
                          navigate({ to: '/app-store/$appId', params: { appId: app.id } })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* All other apps grid */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border/40">
              <h2 className="text-2xl font-bold tracking-tight">Top Apps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2">
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
                    onClick={() => navigate({ to: '/app-store/$appId', params: { appId: app.id } })}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
