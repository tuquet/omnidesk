import * as React from 'react';
import { Link } from '@tanstack/react-router';

import { NavDocuments } from './nav-documents';
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@kbm/ui';
import { CommandIcon } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '@/features/launcher/stores/use-launcher-store';
import { Blocks } from 'lucide-react';
import { useAuth } from '@/features/auth/stores/use-auth-store';

const AppSidebarInner = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { can, filterNav } = useRBAC();
  const { isDevMode } = useDevStore();
  const { t } = useTranslation();
  const { displayName, user } = useAuth();

  const { installedApps } = useLauncherStore();

  // Filter NAV_MAIN by launcher installed apps first
  const launcherFilteredMainNav = NAV_MAIN.filter(item => {
    const appId = item.url.replace('/', '');
    return installedApps.includes(appId);
  });

  const mainItems = filterNav(launcherFilteredMainNav);
  const showcaseItems = filterNav(NAV_SHOWCASE.items);
  const errorItems = filterNav(NAV_ERROR_PAGES.items);
  
  // Inject the App Launcher into the secondary items dynamically
  const launcherItem = {
    title: 'App Launcher',
    url: '/launcher',
    icon: Blocks,
  };
  const secondaryItems = [launcherItem, ...filterNav(NAV_SECONDARY)];
  
  const documentItems = filterNav(NAV_DOCUMENTS);

  const hasShowcase = installedApps.includes('showcase');
  const hasErrorPages = installedApps.includes('error-pages');
  const hasDocuments = installedApps.includes('documents');

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
          items={mainItems.map((item) => ({
            title: item.title,
            url: item.url,
            icon: <item.icon />,
          }))}
        />

        {/* Component Showcase — only if user can see the group and in Dev Mode */}
        {hasShowcase && isDevMode && can(NAV_SHOWCASE.requiredPermission) && showcaseItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t(`nav.${NAV_SHOWCASE.label}`, NAV_SHOWCASE.label)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {showcaseItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={t(`nav.${item.title}`, item.title)} asChild>
                      <Link to={item.url} activeProps={{ 'data-active': true } as Record<string, boolean>}>
                        <item.icon />
                        <span>{t(`nav.${item.title}`, item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Error Pages — only if user can see the group and in Dev Mode */}
        {hasErrorPages && isDevMode && can(NAV_ERROR_PAGES.requiredPermission) && errorItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t(`nav.${NAV_ERROR_PAGES.label}`, NAV_ERROR_PAGES.label)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {errorItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={t(`nav.${item.title}`, item.title)} asChild>
                      <Link to={item.url} activeProps={{ 'data-active': true } as Record<string, boolean>}>
                        <item.icon />
                        <span>{t(`nav.${item.title}`, item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasDocuments && documentItems.length > 0 && (
          <NavDocuments
            items={documentItems.map((d) => ({
              name: d.name,
              url: d.url,
              icon: <d.icon />,
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
        <NavUser user={{
          name: displayName ?? 'User',
          email: user?.email ?? '',
          avatar: user?.user_metadata?.avatar_url ?? '',
        }} />
      </SidebarFooter>
    </Sidebar>
  );
};

export const AppSidebar = React.memo(AppSidebarInner);
AppSidebar.displayName = 'AppSidebar';
