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
import { Database, FileJson } from 'lucide-react';

function ProfileSidebar() {
  return (
    <Sidebar variant="inset" collapsible="none">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-sm">
          <Database className="h-4 w-4" />
          <span>Collections</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>omni-profile</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <FileJson />
                  <span>handlers::browser_profiles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <FileJson />
                  <span>profiles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <span className="text-green-500 font-bold w-6">GET</span>
                  <span>me</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <span className="text-green-500 font-bold w-6">GET</span>
                  <span>health_check</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs">
                  <span className="text-green-500 font-bold w-6">GET</span>
                  <span>ping</span>
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
    <OmniLayout sidebarContent={<ProfileSidebar />}>
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
