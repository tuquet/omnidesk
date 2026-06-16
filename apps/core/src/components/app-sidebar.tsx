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
import { CommandIcon, CompassIcon, AlertTriangleIcon, DatabaseIcon } from 'lucide-react';
import {
  APP_NAME,
  NAV_MAIN,
  NAV_SHOWCASE,
  NAV_ERROR_PAGES,
  NAV_SECONDARY,
  NAV_DOCUMENTS,
} from '@/config';
import { useRBAC } from '@/hooks/use-rbac';
import { useDevStore } from '@/stores/use-dev-store';
import { useLauncherStore } from '@omnidesk/app-launcher';
import { useAuth } from '@omnidesk/app-auth';
import { useQuery } from '@tanstack/react-query';

const AppSidebarInner = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { can, filterNav } = useRBAC();
  const { isDevMode } = useDevStore();
  const { displayName, user } = useAuth();

  const { installedApps } = useLauncherStore();
  const { data: localApps } = useQuery({
    queryKey: ['launcher', 'local-installed-apps'],
    queryFn: async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<any[]>('list_local_apps');
      } catch (e) {
        return [];
      }
    },
    staleTime: 5000,
  });

  const mainItems: any[] = [];

  // Inject local apps dynamically
  if (localApps) {
    for (const app of localApps) {
      // Map icon from manifest if available
      let IconComponent = CommandIcon;
      if (app.icon?.displayName && (LucideIcons as any)[app.icon.displayName]) {
        IconComponent = (LucideIcons as any)[app.icon.displayName];
      }

      mainItems.push({
        title: app.name || app.id,
        url: `/app/${app.id}`,
        icon: IconComponent,
        items: [],
      });
    }
  }

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
          items={mainItems.map((item) => ({
            title: item.title,
            url: item.url as any,
            icon: <item.icon />,
            items: item.items,
          }))}
        />
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
