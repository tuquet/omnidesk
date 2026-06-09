import { Outlet, NavLink, useLocation } from 'react-router';
import { Bug, LayoutDashboard, Settings, Bot, Webhook } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@kbm/ui/components/layouts/sidebar';
import { TopNav, TopNavTitle, TopNavActions } from '@kbm/ui/components/layouts/top-nav';

function getPageTitle(pathname: string) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/issues')) return 'Issues';
  if (pathname.startsWith('/crawler')) return 'Crawler';
  if (pathname.startsWith('/mcp')) return 'MCP Server';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Kill Bug Machine';
}

export function AppLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Bug className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">KBM</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                  <NavLink to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith('/issues')}>
                  <NavLink to="/issues">
                    <Bug className="h-4 w-4" />
                    <span>Issues</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith('/crawler')}>
                  <NavLink to="/crawler">
                    <Webhook className="h-4 w-4" />
                    <span>Crawler</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith('/mcp')}>
                  <NavLink to="/mcp">
                    <Bot className="h-4 w-4" />
                    <span>MCP Server</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname.startsWith('/settings')}>
                <NavLink to="/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav>
            <TopNavTitle>{title}</TopNavTitle>
            <TopNavActions>
              {/* Optional: Add search or global actions here */}
            </TopNavActions>
          </TopNav>
          <main className="flex-1 overflow-auto bg-slate-950 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
