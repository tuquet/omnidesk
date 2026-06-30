import { Outlet, useRouterState, Link } from '@tanstack/react-router';
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
import { Workflow, Blocks } from 'lucide-react';

function StudioSidebar() {
  return (
    <Sidebar variant="inset" collapsible="none" className="w-full">
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
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to="/">
                    <Blocks />
                    <span>My Workflows</span>
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
    <OmniLayout sidebarContent={<StudioSidebar />}>
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full min-h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
