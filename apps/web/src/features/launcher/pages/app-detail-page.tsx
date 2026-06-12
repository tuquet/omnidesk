import { useParams, useNavigate } from '@tanstack/react-router';
import { useLauncherStore, launcherActions } from '../stores/use-launcher-store';
import {
  useMarketplaceApps,
  useInstallApp,
  useUninstallApp,
  type MarketplaceApp,
} from '../api/queries';
import { APP_REGISTRY } from '../config/registry';
import { Button, Skeleton, cn } from '@omnidesk/ui';
import {
  ChevronLeft,
  Loader2,
  Share,
  Star,
  AlertCircle,
  Package,
  Shield,
  Download,
  Calendar,
  Layers,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

export function AppDetailPage() {
  const { appId } = useParams({ from: '/_authenticated/launcher_/$appId' });
  const navigate = useNavigate();
  const { installedApps } = useLauncherStore();

  const { data: marketplaceApps, isLoading, error } = useMarketplaceApps();
  const installMutation = useInstallApp();
  const uninstallMutation = useUninstallApp();

  // Try to find app from server, fallback to local registry
  const serverApp = marketplaceApps?.find((a) => a.id === appId);
  const localRegistryApp = Object.values(APP_REGISTRY).find((a) => a.id === appId);

  const app: MarketplaceApp | undefined =
    serverApp ||
    (localRegistryApp
      ? {
          id: localRegistryApp.id,
          name: localRegistryApp.name,
          description: localRegistryApp.description,
          icon_name: localRegistryApp.icon.displayName ?? 'Box',
          category: localRegistryApp.category,
          is_core: localRegistryApp.isCore ?? false,
          sort_order: 0,
          created_at: new Date().toISOString(),
        }
      : undefined);

  const isInstalled = installedApps.includes(appId);
  const isInstalling = installMutation.isPending && installMutation.variables === appId;
  const isUninstalling = uninstallMutation.isPending && uninstallMutation.variables === appId;

  const handleInstall = () => {
    if (!app) return;
    launcherActions.installApp(app.id);
    installMutation.mutate(app.id, {
      onSuccess: () =>
        toast.success(`Installed ${app.name}!`, {
          description: 'The app is now available in your sidebar.',
        }),
      onError: (err) => {
        launcherActions.uninstallApp(app.id);
        toast.error(`Failed to install ${app.name}`, {
          description: err.message,
        });
      },
    });
  };

  const handleUninstall = () => {
    if (!app) return;
    launcherActions.uninstallApp(app.id);
    uninstallMutation.mutate(app.id, {
      onSuccess: () =>
        toast.success(`Removed ${app.name}`, {
          description: 'The app has been removed from your sidebar.',
        }),
      onError: (err) => {
        launcherActions.installApp(app.id);
        toast.error(`Failed to remove ${app.name}`, {
          description: err.message,
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-6 lg:p-10 w-full max-w-4xl mx-auto">
        <div className="flex items-start gap-6">
          <Skeleton className="h-[120px] w-[120px] rounded-3xl" />
          <div className="flex flex-col gap-3 flex-1 pt-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-24 rounded-full mt-4" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden mt-8">
          <Skeleton className="h-64 w-[280px] rounded-2xl shrink-0" />
          <Skeleton className="h-64 w-[280px] rounded-2xl shrink-0" />
          <Skeleton className="h-64 w-[280px] rounded-2xl shrink-0" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center h-[60vh]">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">App Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The application you are looking for does not exist or cannot be loaded.
          </p>
        </div>
        <Button className="rounded-full px-8 mt-4" onClick={() => navigate({ to: '/launcher' })}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Store
        </Button>
      </div>
    );
  }

  const localApp = APP_REGISTRY[app.id];
  const Icon = localApp?.icon || Package;

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto pb-20">
      {/* Sticky Header Navigation */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-background/95 backdrop-blur-2xl px-6 py-4 border-b border-border/40">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: '/launcher' })}
        >
          <ChevronLeft className="h-4 w-4" />
          App Store
        </Button>
      </div>

      <div className="px-6 lg:px-10 mt-8 flex flex-col gap-10">
        {/* App Header Section */}
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-[2rem] border shadow-sm bg-background">
            <Icon className="h-14 w-14 text-foreground/70" />
          </div>

          <div className="flex flex-col flex-1 min-w-0 pt-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground truncate mb-1">
              {app.name}
            </h1>
            <p className="text-lg text-muted-foreground font-medium mb-1">OmniDesk, Inc.</p>
            <p className="text-sm text-muted-foreground/70 uppercase tracking-wider mb-6">
              {app.category}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-6">
              {isInstalled ? (
                <Button
                  variant="secondary"
                  className="rounded-full px-8 font-bold bg-muted hover:bg-muted-foreground/20 transition-colors group/btn"
                  disabled={isUninstalling || app.is_core}
                  onClick={handleUninstall}
                >
                  {isUninstalling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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
                  className="rounded-full px-8 font-bold bg-primary/10 text-primary hover:bg-primary/20"
                  disabled={isInstalling}
                  onClick={handleInstall}
                >
                  {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'GET'}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 text-primary hover:bg-primary/10"
              >
                <Share className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-12 py-4 border-y border-border/40 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider">
              Rating
            </span>
            <div className="flex items-center gap-1 font-bold text-xl text-foreground">
              4.8 <Star className="h-4 w-4 fill-foreground text-foreground" />
            </div>
          </div>
          <div className="w-px h-10 bg-border/40 hidden sm:block" />
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider">
              Age
            </span>
            <span className="font-bold text-xl text-foreground">4+</span>
          </div>
          <div className="w-px h-10 bg-border/40 hidden sm:block" />
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider">
              Category
            </span>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div className="w-px h-10 bg-border/40 hidden sm:block" />
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <span className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider">
              Developer
            </span>
            <Shield className="h-6 w-6 text-foreground" />
          </div>
        </div>

        {/* Screenshots Placeholder Gallery */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">Preview</h2>
          <div
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .hide-scrollbar::-webkit-scrollbar { display: none; }
            `,
              }}
            />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative flex h-[340px] w-[240px] shrink-0 snap-center flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-muted/50 to-muted/10 border border-border/40"
              >
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-white/5" />
                <Icon className="h-20 w-20 text-muted-foreground/20" />
                <span className="mt-4 text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">
                  Screenshot {i}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">Description</h2>
          <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">
            {app.description}
            {'\n\n'}
            This powerful B2B application seamlessly integrates into your workflow, providing
            advanced tools to enhance productivity and collaboration. Designed for scale, it adapts
            to your team's needs whether you are a small startup or a large enterprise.
            {'\n\n'}
            Key Features: • Real-time synchronization • Advanced analytics and reporting • Secure
            role-based access control • Cross-platform compatibility
          </div>
        </div>

        {/* Information Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight">Information</h2>
          <div className="flex flex-col gap-0 border-y border-border/40">
            <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <span className="text-[15px] text-muted-foreground">Provider</span>
              <span className="text-[15px] font-medium">OmniDesk, Inc.</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <span className="text-[15px] text-muted-foreground">Size</span>
              <span className="text-[15px] font-medium">12.4 MB</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <span className="text-[15px] text-muted-foreground">Category</span>
              <span className="text-[15px] font-medium">{app.category}</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <span className="text-[15px] text-muted-foreground">Compatibility</span>
              <span className="text-[15px] font-medium">Works on this device</span>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <span className="text-[15px] text-muted-foreground">Languages</span>
              <span className="text-[15px] font-medium">English, Vietnamese</span>
            </div>
            {app.is_core && (
              <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
                <span className="text-[15px] text-muted-foreground">System Integration</span>
                <span className="text-[15px] font-medium flex items-center gap-1">
                  <Shield className="h-4 w-4" /> Required Component
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
