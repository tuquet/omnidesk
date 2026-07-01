import type { MarketplaceApp } from '@omnidesk/types';
import { APP_REGISTRY } from '../config/registry';
import { Button } from '@omnidesk/ui';;
import { Package, Loader2 } from 'lucide-react';

interface FeaturedBannerProps {
  app: MarketplaceApp;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export function FeaturedBanner({
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
