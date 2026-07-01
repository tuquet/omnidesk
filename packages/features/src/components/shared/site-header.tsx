import { memo } from 'react';
import { Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@omnidesk/ui';;
import { WrenchIcon, TrashIcon, BugIcon, LogOutIcon } from 'lucide-react';
import { NotificationButton } from '@omnidesk/core';
import { ConsoleLoggerButton } from '@omnidesk/core';
import { SmartBreadcrumb } from '@omnidesk/core';
import { GlobalSearch } from './global-search';
import { useDevStore } from '@omnidesk/core';
import { HeaderUser } from '@omnidesk/core';

export const SiteHeader = memo(function SiteHeader() {
  const { isDevMode, setDevMode } = useDevStore();

  return (
    <header className="flex h-12 shrink-0 items-center border-b px-4 lg:px-6">
      <div className="flex w-full items-center gap-1 lg:gap-2 px-2">
        <SmartBreadcrumb />
        <div className="flex-1" />
        <div className="flex items-center gap-1 shrink-0">
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
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Developer Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Clear Local Storage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      throw new Error('Simulated application crash for testing');
                    }}
                  >
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
          <HeaderUser />
        </div>
      </div>
    </header>
  );
});
