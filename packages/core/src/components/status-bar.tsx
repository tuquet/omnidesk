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
  Monitor,
  Languages,
  FileJson,
  BookOpen,
} from 'lucide-react';
import { HeaderUser } from './header-user';
import { NotificationButton } from './notification-button';
import { GlobalSearch } from './global-search';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';
import { HardwareMonitor } from './hardware-monitor';
import { NetworkStatus } from './network-status';
import { AppVersion } from './app-version';

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
        <ThemeToggle />
        <LanguageSwitcher
          triggerNode={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-foreground"
              title="Switch Language"
            >
              <Languages className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <HeaderUser
          triggerNode={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-foreground"
              title="Account & Login"
            >
              <Key className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          onClick={() => platformApi.openUrl(config.githubRepo || '')}
          title="GitHub Repo"
        >
          <Github className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          onClick={() =>
            platformApi.openUrl(config.apiDocsUrl?.replace('/scalar', '/openapi.json') || '')
          }
          title="OpenAPI Specs (openapi.json)"
        >
          <FileJson className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          onClick={() => platformApi.openUrl(config.apiDocsUrl || '')}
          title="API Documentation (Scalar UI)"
        >
          <BookOpen className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          title="OmniDesk Pro"
        >
          <Diamond className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>

      {/* ── Right Section ── */}
      <div className="flex items-center gap-1">
        <GlobalSearch
          triggerNode={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-foreground"
              title="Global Search (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <NotificationButton
          triggerNode={
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-foreground"
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <div className="h-4 w-px bg-border mx-1" />

        <NetworkStatus />
        <HardwareMonitor />

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-foreground"
          title="System Status"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground" title="Cookies">
          <Cookie className="h-3.5 w-3.5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-foreground" title="Dev Tools">
          <Wrench className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <AppVersion />
      </div>
    </div>
  );
}
