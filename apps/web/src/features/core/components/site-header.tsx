import { Separator } from '@kbm/ui';
import { SidebarTrigger } from '@kbm/ui';
import { UpdaterButton } from '@/features/core/components/updater-button';
import { ThemeToggle } from '@/features/core/components/theme-toggle';
import { LanguageSwitcher } from '@/features/core/components/language-switcher';
import { FullscreenToggle } from '@/features/core/components/fullscreen-toggle';
import { NotificationButton } from '@/features/core/components/notification-button';

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Bảng Điều Khiển</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <NotificationButton />
          <LanguageSwitcher />
          <ThemeToggle />
          <FullscreenToggle />
          <UpdaterButton />
        </div>
      </div>
    </header>
  );
}
