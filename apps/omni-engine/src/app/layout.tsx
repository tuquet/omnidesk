import { Outlet, useRouterState, Link } from '@tanstack/react-router';
import { OmniLayout } from '@omnidesk/core';
import { Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@omnidesk/ui';;
import { MonitorPlay, Settings, Terminal, Zap } from 'lucide-react';
import { ROUTES } from '@/config/route-config';

function EngineSidebar() {
  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-sm">
          <MonitorPlay className="h-4 w-4" />
          <span>Command Center</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to={ROUTES.HOME}>
                    <Terminal />
                    <span>Execute Order</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to={ROUTES.ACTIVE_JOBS}>
                    <Zap />
                    <span>Triggers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to={ROUTES.SETTINGS}>
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppLayout() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <OmniLayout sidebarContent={<EngineSidebar />}>
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full min-h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
