import { type MarketplaceApp } from '../api/queries';
import { APP_REGISTRY } from '../config/registry';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@kbm/ui';
import {
  Check,
  Download,
  Package,
  Shield,
  Loader2,
  Trash2,
  Calendar,
} from 'lucide-react';

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Core: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  Productivity: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  Analytics: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  Development: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
  },
  Utilities: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
  },
};

interface AppDetailDialogProps {
  app: MarketplaceApp | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInstalled: boolean;
  isInstalling: boolean;
  isUninstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

export function AppDetailDialog({
  app,
  open,
  onOpenChange,
  isInstalled,
  isInstalling,
  isUninstalling,
  onInstall,
  onUninstall,
}: AppDetailDialogProps) {
  if (!app) return null;

  const localApp = APP_REGISTRY[app.id];
  const Icon = localApp?.icon;
  const style = CATEGORY_STYLES[app.category] ?? CATEGORY_STYLES.Utilities;

  const createdDate = new Date(app.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                style.bg,
              )}
            >
              {Icon ? (
                <Icon className={cn('h-7 w-7', style.text)} />
              ) : (
                <Package className={cn('h-7 w-7', style.text)} />
              )}
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-lg">
                {app.name}
                {app.is_core && (
                  <Badge
                    variant="secondary"
                    className="gap-1 px-1.5 py-0 text-[10px]"
                  >
                    <Shield className="h-2.5 w-2.5" />
                    Core
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-[10px]', style.text)}>
                  {app.category}
                </Badge>
                {isInstalled && (
                  <Badge
                    variant="secondary"
                    className="gap-1 px-1.5 py-0 text-[10px] text-green-600 dark:text-green-400"
                  >
                    <Check className="h-2.5 w-2.5" />
                    Installed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <DialogDescription className="text-sm leading-relaxed">
            {app.description}
          </DialogDescription>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Added {createdDate}
          </div>
        </div>

        <DialogFooter>
          {isInstalled ? (
            app.is_core ? (
              <div className="flex w-full items-center justify-center rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                <Shield className="mr-2 h-4 w-4" />
                System app — cannot be removed
              </div>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                disabled={isUninstalling}
                onClick={onUninstall}
              >
                {isUninstalling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {isUninstalling ? 'Removing...' : 'Remove App'}
              </Button>
            )
          ) : (
            <Button
              className="w-full"
              disabled={isInstalling}
              onClick={onInstall}
            >
              {isInstalling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isInstalling ? 'Installing...' : 'Install App'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
