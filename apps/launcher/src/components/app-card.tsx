import type { MarketplaceApp } from '../api/queries';
import { APP_REGISTRY } from '../config/registry';
import { Button } from '@omnidesk/ui';
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
