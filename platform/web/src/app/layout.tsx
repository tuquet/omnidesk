import { Outlet, useRouterState } from '@tanstack/react-router';
import { SiteHeader } from '@omnidesk/app-core';
import { RouteProgressBar } from '@omnidesk/app-core';

export function AppLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <>
      <RouteProgressBar />
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-auto">
          <div key={currentPath} className="page-transition flex flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
