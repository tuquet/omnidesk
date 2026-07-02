import { Outlet, useRouterState, Link } from '@tanstack/react-router';
import { OmniLayout } from '@omnidesk/core';
import { Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@omnidesk/ui';
import { ShieldCheck, LayoutDashboard, Globe, Tags, Settings } from 'lucide-react';

function ProfileSidebar() {
  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Profile Manager</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Browser Profiles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to="/proxies">
                    <Globe />
                    <span>Proxies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to="/tags">
                    <Tags />
                    <span>Tags & Groups</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-xs" asChild>
                  <Link to="/settings">
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
    <OmniLayout sidebarContent={<ProfileSidebar />}>
      <div key={currentPath} className="page-transition flex flex-1 flex-col w-full min-h-full">
        <Outlet />
      </div>
    </OmniLayout>
  );
}
