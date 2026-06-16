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

  // Filter NAV_MAIN by launcher installed apps first
  const launcherFilteredMainNav = NAV_MAIN.filter((item) => {
    const appId = item.url.replace('/', '');
    return installedApps.includes(appId);
  });
  
  // Inject local apps
  if (localApps) {
    for (const app of localApps) {
      if (!launcherFilteredMainNav.some(n => n.url === `/app/${app.id}`)) {
        launcherFilteredMainNav.push({
          title: app.name || app.id,
          url: `/app/${app.id}`,
          icon: CommandIcon, // Fallback icon
          items: [],
          requiredPermission: 'view_dashboard',
        } as any);
      }
    }
  }

  const mainItems = filterNav(launcherFilteredMainNav);
  const showcaseItems = filterNav(NAV_SHOWCASE.items);
  const errorItems = filterNav(NAV_ERROR_PAGES.items);

  const secondaryItems = filterNav(NAV_SECONDARY);

  const documentItems = filterNav(NAV_DOCUMENTS);

  const hasShowcase = installedApps.includes('showcase');
  const hasErrorPages = installedApps.includes('error-pages');
  const hasDocuments = installedApps.includes('documents');

  const combinedMainItems = [...mainItems];

  if (
    hasShowcase &&
    isDevMode &&
    can(NAV_SHOWCASE.requiredPermission) &&
    showcaseItems.length > 0
  ) {
    const firstShowcaseUrl = showcaseItems[0]?.url ?? '';
    combinedMainItems.push({
      title: NAV_SHOWCASE.label,
      url: firstShowcaseUrl,
      icon: CompassIcon,
      items: showcaseItems,
    } as unknown as (typeof mainItems)[number]);
  }

  if (
    hasErrorPages &&
    isDevMode &&
    can(NAV_ERROR_PAGES.requiredPermission) &&
    errorItems.length > 0
  ) {
    const firstErrorUrl = errorItems[0]?.url ?? '';
    combinedMainItems.push({
      title: NAV_ERROR_PAGES.label,
      url: firstErrorUrl,
      icon: AlertTriangleIcon,
      items: errorItems,
    } as unknown as (typeof mainItems)[number]);
  }

  if (hasDocuments && documentItems.length > 0) {
    const firstDocUrl = documentItems[0]?.url ?? '';
    combinedMainItems.push({
      title: 'Documents',
      url: firstDocUrl,
      icon: DatabaseIcon,
      items: documentItems.map((d) => ({ title: d.name, url: d.url })),
    } as unknown as (typeof mainItems)[number]);
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link to="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">{APP_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={combinedMainItems.map((item) => ({
            title: item.title,
            url: item.url,
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
