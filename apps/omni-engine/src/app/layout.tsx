import { Outlet, useRouterState } from '@tanstack/react-router';
import { OmniLayout } from '@omnidesk/core';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@omnidesk/ui';
import { MonitorPlay, Settings, Terminal, Zap } from 'lucide-react';

function EngineSidebar() {
  return (
    <Sidebar variant="inset" collapsible="none" className="w-full">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-sm">
          <MonitorPlay className="h-4 w-4" />
          <span>Orchestrator</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Terminal />
                  <span>Runtimes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Zap />
                  <span>Triggers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Settings />
                  <span>Settings</span>
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
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
