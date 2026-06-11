import { useState, useMemo, useCallback } from 'react';
import { AppDetailDialog } from './app-detail-dialog';
import { APP_REGISTRY, type AppCategory } from '../config/registry';
import { launcherActions, useLauncherStore } from '../stores/use-launcher-store';
import {
  useMarketplaceApps,
  useInstalledApps,
  useInstallApp,
  useUninstallApp,
  type MarketplaceApp,
} from '../api/queries';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@kbm/ui';
import {
  Check,
  Download,
  Trash2,
  AlertCircle,
  RefreshCw,
  Search,
  Package,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

// ─── Category Colors ────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: string }
> = {
  Core: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
  },
  Productivity: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  Analytics: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
  },
  Development: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
    icon: 'text-violet-500',
  },
  Utilities: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    icon: 'text-slate-500',
  },
};

const ALL_CATEGORIES: AppCategory[] = [
  'Core',
  'Productivity',
  'Analytics',
  'Development',
  'Utilities',
];

// ─── App Card Component ─────────────────────────────────────────────────────

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
  const Icon = localApp?.icon;
  const style = CATEGORY_STYLES[app.category] ?? CATEGORY_STYLES.Utilities;

  return (
    <Card
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        isInstalled && 'ring-1 ring-primary/20',
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative pb-3 cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105',
                style.bg,
              )}
            >
              {Icon ? (
                <Icon className={cn('h-5 w-5', style.icon)} />
              ) : (
                <Package className={cn('h-5 w-5', style.icon)} />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight flex items-center gap-2">
                <span className="truncate">{app.name}</span>
                {app.is_core && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 gap-1 px-1.5 py-0 text-[10px] font-medium"
                  >
                    <Shield className="h-2.5 w-2.5" />
                    Core
                  </Badge>
                )}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  'mt-1 px-1.5 py-0 text-[10px] font-medium border',
                  style.text,
                  style.border,
                )}
              >
                {app.category}
              </Badge>
            </div>
          </div>

          {/* Status indicator */}
          {isInstalled && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-3.5 w-3.5 text-green-500" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 pb-3">
        <CardDescription className="text-xs leading-relaxed line-clamp-2">
          {app.description}
        </CardDescription>
      </CardContent>

      <CardFooter className="relative pt-0">
        {isInstalled ? (
          app.is_core ? (
            <div className="flex w-full items-center justify-center rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="mr-1.5 h-3 w-3" />
              System Required
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isUninstalling}
              onClick={onUninstall}
            >
              {isUninstalling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isUninstalling ? 'Removing...' : 'Remove'}
            </Button>
          )
        ) : (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-1.5"
            disabled={isInstalling}
            onClick={onInstall}
          >
            {isInstalling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AppLauncher() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);
  const { installedApps } = useLauncherStore();

  // Server data
  const {
    data: marketplaceApps,
    isLoading: isLoadingApps,
    error: appsError,
    refetch: refetchApps,
  } = useMarketplaceApps();

  const { data: serverInstalledApps, isLoading: isLoadingInstalled } =
    useInstalledApps();

  const installMutation = useInstallApp();
  const uninstallMutation = useUninstallApp();

  // Sync server state → local store
  useEffect(() => {
    if (serverInstalledApps) {
      launcherActions.syncFromServer(serverInstalledApps);
    }
  }, [serverInstalledApps]);

  // Fallback to local registry
  const apps: MarketplaceApp[] = useMemo(
    () =>
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
      })),
    [marketplaceApps],
  );

  // Filtered apps
  const filteredApps = useMemo(() => {
    let result = apps;

    // Filter by tab
    if (activeTab === 'installed') {
      result = result.filter((app) => installedApps.includes(app.id));
    } else if (activeTab !== 'all') {
      result = result.filter((app) => app.category === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q),
      );
    }

    return result;
  }, [apps, activeTab, searchQuery, installedApps]);

  // Stats
  const stats = useMemo(() => {
    const total = apps.length;
    const installed = apps.filter((app) => installedApps.includes(app.id)).length;
    const core = apps.filter((app) => app.is_core).length;
    return { total, installed, core, available: total - installed };
  }, [apps, installedApps]);

  const handleInstall = useCallback(
    (appId: string, appName: string) => {
      launcherActions.installApp(appId);
      installMutation.mutate(appId, {
        onSuccess: () =>
          toast.success(`Installed ${appName}!`, {
            description: 'The app is now available in your sidebar.',
          }),
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

  // Loading state
  if (isLoadingApps || isLoadingInstalled) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8 w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (appsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Failed to load marketplace</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {appsError.message}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchApps()}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">App Marketplace</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your workspace by installing the modules you need.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{stats.installed}</strong> of{' '}
            {stats.total} installed
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{stats.core}</strong> core
          </span>
        </div>
        {stats.available > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Download className="h-4 w-4" />
              <span>
                <strong className="text-foreground">{stats.available}</strong>{' '}
                available
              </span>
            </div>
          </>
        )}
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="installed" className="text-xs px-3">
              Installed
            </TabsTrigger>
            {ALL_CATEGORIES.filter((cat) =>
              apps.some((app) => app.category === cat),
            ).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-3 hidden md:inline-flex">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* App Grid */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              No apps found
            </p>
            <p className="text-xs text-muted-foreground/70">
              {searchQuery
                ? 'Try a different search term.'
                : 'No apps match the selected filter.'}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isInstalled={installedApps.includes(app.id)}
              isInstalling={
                installMutation.isPending &&
                installMutation.variables === app.id
              }
              isUninstalling={
                uninstallMutation.isPending &&
                uninstallMutation.variables === app.id
              }
              onInstall={() => handleInstall(app.id, app.name)}
              onUninstall={() => handleUninstall(app.id, app.name)}
              onClick={() => setSelectedApp(app)}
            />
          ))}
        </div>
      )}

      {/* App Detail Dialog */}
      <AppDetailDialog
        app={selectedApp}
        open={selectedApp !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedApp(null);
        }}
        isInstalled={selectedApp ? installedApps.includes(selectedApp.id) : false}
        isInstalling={
          selectedApp !== null &&
          installMutation.isPending &&
          installMutation.variables === selectedApp.id
        }
        isUninstalling={
          selectedApp !== null &&
          uninstallMutation.isPending &&
          uninstallMutation.variables === selectedApp.id
        }
        onInstall={() => {
          if (selectedApp) handleInstall(selectedApp.id, selectedApp.name);
        }}
        onUninstall={() => {
          if (selectedApp) handleUninstall(selectedApp.id, selectedApp.name);
        }}
      />
    </div>
  );
}
