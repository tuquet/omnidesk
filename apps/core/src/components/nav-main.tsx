import { Link, useLocation } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@omnidesk/ui';
import { CirclePlusIcon, MailIcon, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NavMain({
  items,
  groupLabel,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  groupLabel?: string;
}) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isPathActive = location.pathname.startsWith(item.url);
            const hasSubItems = item.items && item.items.length > 0;

            if (hasSubItems) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive || isPathActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon}
                        <span>{t(`nav.${item.title}`, item.title)}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={subItem.url}
                                activeProps={{ 'data-active': 'true' }}
                                activeOptions={{ exact: true }}
                              >
                                <span>{t(`nav.${subItem.title}`, subItem.title)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link
                    to={item.url}
                    activeProps={{ 'data-active': 'true' }}
                    activeOptions={{ exact: false }}
                  >
                    {item.icon}
                    <span>{t(`nav.${item.title}`, item.title)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
