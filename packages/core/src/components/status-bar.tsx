import { useTranslation } from 'react-i18next';
import { usePlatform } from '../providers/platform-provider';
import { useAppConfig } from '../providers/config-provider';
import { Button } from '@omnidesk/ui';
import {
  Settings,
  Key,
  Bell,
  Github,
  Diamond,
  AlertTriangle,
  Search,
  Cookie,
  Wrench,
} from 'lucide-react';

export function StatusBar() {
  const platformApi = usePlatform();
  const { config } = useAppConfig();

  if (platformApi.platform !== 'desktop') return null;

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t bg-background select-none px-2 text-xs text-muted-foreground z-50">
      {/* ── Left Section ── */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground">
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground">
          <Key className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground">
          <Bell className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          onClick={() => platformApi.openUrl(config.githubRepo || '')}
        >
          <Github className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-medium"
        >
          <Diamond className="h-3.5 w-3.5 mr-1.5 fill-current" />
          OmniDesk Pro
        </Button>
      </div>

      {/* ── Right Section ── */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
        >
          <AlertTriangle className="h-3 w-3 mr-1.5" />
          System Status
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button variant="ghost" size="sm" className="h-6 px-2 hover:text-foreground">
          <Search className="h-3.5 w-3.5 mr-1.5" />
          Search
        </Button>

        <Button variant="ghost" size="sm" className="h-6 px-2 hover:text-foreground">
          <Cookie className="h-3.5 w-3.5 mr-1.5" />
          Cookies
        </Button>

        <Button variant="ghost" size="sm" className="h-6 px-2 hover:text-foreground">
          <Wrench className="h-3.5 w-3.5 mr-1.5" />
          Dev Tools
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <span className="px-2 cursor-default opacity-70">v1.0.0</span>
      </div>
    </div>
  );
}
