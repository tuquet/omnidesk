import { Separator } from '@kbm/ui';
import { SidebarTrigger } from '@kbm/ui';
import { ThemeToggle } from '@/features/core/components/theme-toggle';
import { LanguageSwitcher } from '@/features/core/components/language-switcher';
import { NotificationButton } from '@/features/core/components/notification-button';
import { ConsoleLoggerButton } from '@/features/core/components/console-logger-button';
import { SmartBreadcrumb } from '@/features/core/components/smart-breadcrumb';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="mx-2 h-4 !self-center" />
        <SmartBreadcrumb />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <ConsoleLoggerButton />
          <NotificationButton />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
