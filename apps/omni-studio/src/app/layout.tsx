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
import { Activity, Workflow, Blocks, Clock } from 'lucide-react';

function StudioSidebar() {
  return (
    <Sidebar variant="inset" collapsible="none">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-sm">
          <Workflow className="h-4 w-4" />
          <span>Workflows</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Automation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Blocks />
                  <span>My Workflows</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Activity />
                  <span>Executions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <Clock />
                  <span>Schedules</span>
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
    <OmniLayout sidebarContent={<StudioSidebar />}>
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
