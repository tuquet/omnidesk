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
  APP_REGISTRY,
} from '@/config';
import { useRBAC } from '@/hooks/use-rbac';
import { useDevStore } from '@/stores/use-dev-store';
import { useAuth, supabase } from '@omnidesk/app-auth';
import { useQuery } from '@tanstack/react-query';
import { Platform } from '@/lib/platform';

const AppSidebarInner = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { can, filterNav } = useRBAC();
  const { isDevMode } = useDevStore();
  const { displayName, user, role } = useAuth();
  const currentUserRole = role || 'GUEST';

  const { data: installedAppIds } = useQuery({
    queryKey: ['sidebar', 'user-installed-apps', user?.id],
    queryFn: async () => {
      if (Platform.isDesktop) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const localApps = await invoke<any[]>('list_local_apps');
          return localApps.map((a) => a.id);
        } catch (e) {
          return [];
        }
      } else {
        if (!user?.id) return [];
        const { data, error } = await supabase
          .from('user_installed_apps')
          .select('app_id');
        if (error || !data) return [];
        return data.map((item) => item.app_id);
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const mainItems: any[] = [];
  const activeInstalledIds = new Set(installedAppIds || []);

  for (const app of APP_REGISTRY) {
    // 1. Kiểm tra User Role
    if (app.requiredUserRoles && !app.requiredUserRoles.includes(currentUserRole)) {
      continue;
    }
    // 2. Kiểm tra App Role (Kernel vs Marketplace)
    if (app.appRole === 'marketplace' && !activeInstalledIds.has(app.id)) {
      continue;
    }

    mainItems.push({
      title: app.name,
      url: `/app/${app.id}`,
      icon: app.icon,
      items: [],
    });
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
