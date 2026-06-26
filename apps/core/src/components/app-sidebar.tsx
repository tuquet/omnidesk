import * as React from 'react';
import { Link } from '@tanstack/react-router';

import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@omnidesk/ui';
import * as LucideIcons from 'lucide-react';
import { CommandIcon, CompassIcon, AlertTriangleIcon, DatabaseIcon, LayoutDashboardIcon, PackageOpen } from 'lucide-react';
import {
  APP_NAME,
  NAV_MAIN,
  NAV_SHOWCASE,
  NAV_ERROR_PAGES,
  NAV_SECONDARY,
  NAV_DOCUMENTS,
} from '@/config';
import { useRBAC } from '@/hooks/use-rbac';
import { useAuth } from '@omnidesk/app-auth';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Platform } from '@/lib/platform';

const AppSidebarInner = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { can, filterNav } = useRBAC();
  const { isDevMode } = useDevStore();
  const { displayName, user, role } = useAuth();
  const currentUserRole = role || 'GUEST';

  const { data: installedApps } = useQuery({
    queryKey: ['sidebar', 'dynamic-apps', user?.id],
    queryFn: async () => {
      if (Platform.isDesktop) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const localApps = await invoke<any[]>('list_local_apps');
          return localApps.map((a) => ({ id: a.id, name: a.name || a.id }));
        } catch (e) {
          return [];
        }
      } else {
        if (!user?.id) return [];
        const { data, error } = await supabase
          .from('user_installed_apps')
          .select('app_id, marketplace_apps(id, name)');
        if (error || !data) return [];
        return data
          .filter((item: any) => item.marketplace_apps)
          .map((item: any) => ({
            id: item.marketplace_apps.id,
            name: item.marketplace_apps.name,
          }));
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const systemItems: any[] = [
    {
      title: 'Command Center',
      url: '/app/dashboard',
      icon: LayoutDashboardIcon,
      items: [],
    }
  ];

  const dynamicItems: any[] = [];
  if (installedApps) {
    for (const app of installedApps) {
      dynamicItems.push({
        title: app.name || app.id,
        url: `/app/${app.id}`,
        icon: PackageOpen,
        items: [],
      });
    }
  }

  const devItems: any[] = NAV_SHOWCASE.items.map((item: any) => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
    items: [],
  }));

  const secondaryItems = filterNav(NAV_SECONDARY);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link to="/app/$appId" params={{ appId: "dashboard" }}>
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">{APP_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          groupLabel="System"
          items={systemItems.map((item) => ({
            title: item.title,
            url: item.url as any,
            icon: <item.icon />,
            items: item.items,
          }))}
        />
        {dynamicItems.length > 0 && (
          <NavMain
            groupLabel="My Apps"
            items={dynamicItems.map((item) => ({
              title: item.title,
              url: item.url as any,
              icon: <item.icon />,
              items: item.items,
            }))}
          />
        )}
        {(isDevMode || currentUserRole === 'ADMIN') && devItems.length > 0 && (
          <NavMain
            groupLabel="Developer Tools"
            items={devItems.map((item) => ({
              title: item.title,
              url: item.url as any,
              icon: <item.icon />,
              items: item.items,
            }))}
          />
        )}
        <NavSecondary
          items={secondaryItems.map((item) => ({
            title: item.title,
            url: item.url,
            icon: <item.icon />,
          }))}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName ?? 'User',
            email: user?.email ?? '',
            avatar: (user?.user_metadata?.avatar_url as string) ?? '',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export const AppSidebar = React.memo(AppSidebarInner);
AppSidebar.displayName = 'AppSidebar';
