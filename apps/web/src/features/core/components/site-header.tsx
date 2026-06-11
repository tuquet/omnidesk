import { memo } from 'react';
import { Separator, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@kbm/ui';
import { SidebarTrigger } from '@kbm/ui';
import { WrenchIcon, TrashIcon, BugIcon, LogOutIcon } from 'lucide-react';
import { ThemeToggle } from '@/features/core/components/theme-toggle';
import { LanguageSwitcher } from '@/features/core/components/language-switcher';
import { NotificationButton } from '@/features/core/components/notification-button';
import { ConsoleLoggerButton } from '@/features/core/components/console-logger-button';
import { SmartBreadcrumb } from '@/features/core/components/smart-breadcrumb';
import { GlobalSearch } from '@/features/core/components/global-search';
import { useDevStore } from '@/stores/use-dev-store';

export const SiteHeader = memo(function SiteHeader() {
  const { isDevMode, setDevMode } = useDevStore();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="mx-2 h-4 !self-center" />
        <SmartBreadcrumb />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <GlobalSearch />
          {isDevMode && (
            <>
              <ConsoleLoggerButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <WrenchIcon className="h-4 w-4" />
                    <span className="sr-only">Developer Tools</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Developer Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Clear Local Storage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    throw new Error('Simulated application crash for testing');
                  }}>
                    <BugIcon className="mr-2 h-4 w-4" />
                    Simulate Error
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDevMode(false)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Exit Dev Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <NotificationButton />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
});
