import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppSidebar } from '@omnidesk/app-core';
import { SiteHeader } from '@omnidesk/app-core';
import { RouteProgressBar } from '@omnidesk/app-core';
import { SidebarInset, SidebarProvider } from '@omnidesk/ui';
import { SIDEBAR_WIDTH, HEADER_HEIGHT } from '@/config';
import { useLayoutStore } from '@/stores/use-layout-store';

export function AppLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();

  return (
    <>
      <RouteProgressBar />
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
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
            <div key={currentPath} className="page-transition flex flex-1 flex-col pb-8">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
