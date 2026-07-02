import type { AppDefinition } from '@omnidesk/types';
import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, ScrollArea } from '@omnidesk/ui';
import { useDevStore, useAppConfig } from '@omnidesk/core';
import { SearchIcon } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '@omnidesk/app-launcher';
import { APP_REGISTRY} from '@omnidesk/app-launcher';

export function GlobalSearch({ triggerNode }: { triggerNode?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isDevMode } = useDevStore();
  const { config, rbac: { can, filterNav } } = useAppConfig();
  const { navMain: NAV_MAIN, navDocuments: NAV_DOCUMENTS, navSecondary: NAV_SECONDARY, navShowcase: NAV_SHOWCASE, navErrorPages: NAV_ERROR_PAGES } = config;
  const { t } = useTranslation();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const mainItems = filterNav(NAV_MAIN);
  const documentItems = filterNav(NAV_DOCUMENTS);
  const secondaryItems = filterNav(NAV_SECONDARY);
  const showcaseItems = filterNav(NAV_SHOWCASE.items);
  const errorItems = filterNav(NAV_ERROR_PAGES.items);

  const { installedApps } = useLauncherStore();
  const installedAppItems = installedApps
    .map((appId) => APP_REGISTRY[appId])
    .filter((app): app is AppDefinition => !!app);

  return (
    <>
      {triggerNode ? (
        <div onClick={() => setOpen(true)}>{triggerNode}</div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 shrink-0"
          onClick={() => setOpen(true)}
        >
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <ScrollArea className="max-h-[300px]">
              <CommandEmpty>No results found.</CommandEmpty>

            {mainItems.length > 0 && (
              <CommandGroup heading={t('nav.Main', 'Main')}>
                {mainItems.map((item: any) => (
                  <CommandItem
                    key={item.url}
                    value={t(`nav.${item.title}`, item.title) as string}
                    onSelect={() => runCommand(() => navigate({ to: item.url }))}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{t(`nav.${item.title}`, item.title) as string}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {documentItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('nav.Documents', 'Documents')}>
                  {documentItems.map((item: any) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.name}`, item.name) as string}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.name}`, item.name) as string}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {installedAppItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('nav.My Apps', 'My Apps')}>
                  {installedAppItems.map((app) => {
                    const Icon = app.icon;
                    const routeTo = app.href || `/${app.id}`;
                    return (
                      <CommandItem
                        key={app.id}
                        value={app.name}
                        onSelect={() => runCommand(() => navigate({ to: routeTo }))}
                      >
                        {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                        <span>{app.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}

            {secondaryItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('nav.Settings & More', 'Settings & More')}>
                  {secondaryItems.map((item: any) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title) as string}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title) as string}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {isDevMode && can(NAV_SHOWCASE.requiredPermission) && showcaseItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t(`nav.${NAV_SHOWCASE.label}`, NAV_SHOWCASE.label)}>
                  {showcaseItems.map((item: any) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title) as string}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title) as string}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {isDevMode && can(NAV_ERROR_PAGES.requiredPermission) && errorItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t(`nav.${NAV_ERROR_PAGES.label}`, NAV_ERROR_PAGES.label)}>
                  {errorItems.map((item: any) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title) as string}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title) as string}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
              </ScrollArea>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
