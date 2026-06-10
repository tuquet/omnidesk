import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppSidebar } from '@/features/core/components/app-sidebar';
import { SiteHeader } from '@/features/core/components/site-header';
import { TitleBar } from '@/features/core/components/title-bar';
import { ResizeHandles } from '@/features/core/components/resize-handles';
import { RouteProgressBar } from '@/features/core/components/route-progress-bar';
import { SidebarInset, SidebarProvider } from '@kbm/ui';
import { SIDEBAR_WIDTH, HEADER_HEIGHT } from '@/config';

export function AppLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="relative flex h-screen flex-col">
      <ResizeHandles />
      <TitleBar />
      <RouteProgressBar />
      <SidebarProvider
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--header-height': HEADER_HEIGHT,
          } as React.CSSProperties
        }
        className="flex-1 overflow-hidden"
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="relative">
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-auto">
            <div key={currentPath} className="page-transition flex flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
