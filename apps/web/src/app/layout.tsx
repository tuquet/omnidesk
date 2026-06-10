import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from '@/features/core/components/app-sidebar';
import { SiteHeader } from '@/features/core/components/site-header';
import { TitleBar } from '@/features/core/components/title-bar';
import { SidebarInset, SidebarProvider } from '@kbm/ui';

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
        className="flex-1 overflow-hidden"
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
