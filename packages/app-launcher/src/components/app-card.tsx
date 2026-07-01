import type { MarketplaceApp } from '@omnidesk/types';
import { APP_REGISTRY } from '../config/registry';
import { Button } from '@omnidesk/ui';;
import { Package, Shield, Loader2 } from 'lucide-react';

interface AppCardProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  isInstalling: boolean;
  isUninstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onClick: () => void;
}

export function AppCard({
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
      className="group relative flex items-center gap-4 py-3 cursor-pointer w-full hover:bg-muted/30 px-3 -mx-3 rounded-2xl transition-colors"
      onClick={onClick}
    >
      {/* App Icon - iOS Style */}
      <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[14px] border border-border/20 shadow-sm bg-background relative overflow-hidden">
        {/* Subtle inner highlight to mimic iOS icon glass/3D effect */}
        <div className="absolute inset-0 rounded-[14px] ring-1 ring-inset ring-foreground/5 pointer-events-none" />
        <Icon className="h-8 w-8 text-foreground/80" strokeWidth={1.5} />
      </div>

      {/* Info Container with Bottom Border */}
      <div className="flex flex-1 min-w-0 items-center justify-between py-2 border-b border-border/40 group-last:border-transparent h-full">
        <div className="flex flex-col min-w-0 pr-4 justify-center">
          <h3 className="text-[16px] font-semibold leading-tight truncate text-foreground flex items-center gap-1.5">
            {app.name}
            {app.is_core && <Shield className="h-3.5 w-3.5 text-muted-foreground/60" />}
          </h3>
          <p className="text-[13px] text-muted-foreground truncate mt-0.5">{app.description}</p>
          {/* Subtle category tag under the description (Mac App Store style) */}
          <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mt-1 hidden sm:block">
            {app.category}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex shrink-0 items-center pl-2" onClick={(e) => e.stopPropagation()}>
          {isInstalled ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 rounded-full px-4 text-[13px] font-bold text-foreground bg-muted hover:bg-muted/80 transition-colors group/btn w-[72px]"
              disabled={isUninstalling || app.is_core}
              onClick={onUninstall}
            >
              {isUninstalling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span className="inline group-hover/btn:hidden">OPEN</span>
                  <span className="hidden group-hover/btn:inline text-[11px]">
                    {app.is_core ? 'CORE' : 'REMOVE'}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 rounded-full px-4 text-[13px] font-bold bg-muted text-foreground hover:bg-muted/80 w-[72px]"
              disabled={isInstalling}
              onClick={onInstall}
            >
              {isInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'GET'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
