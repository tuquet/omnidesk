import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Button,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@omnidesk/ui';
import { useDevStore } from '@/stores/use-dev-store';
import { useRBAC } from '@/hooks/use-rbac';
import { SearchIcon } from 'lucide-react';
import { NAV_MAIN, NAV_DOCUMENTS, NAV_SECONDARY, NAV_SHOWCASE, NAV_ERROR_PAGES } from '@/config';
import { useTranslation } from 'react-i18next';
import { useLauncherStore } from '@omnidesk/app-launcher';
import { APP_REGISTRY, type AppDefinition } from '@omnidesk/app-launcher';

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isDevMode } = useDevStore();
  const { can, filterNav } = useRBAC();
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
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 shrink-0"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {mainItems.length > 0 && (
              <CommandGroup heading={t('nav.Main', 'Main')}>
                {mainItems.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={t(`nav.${item.title}`, item.title)}
                    onSelect={() => runCommand(() => navigate({ to: item.url }))}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{t(`nav.${item.title}`, item.title)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {documentItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('nav.Documents', 'Documents')}>
                  {documentItems.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.name}`, item.name)}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.name}`, item.name)}</span>
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
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
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
                  {secondaryItems.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title)}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {isDevMode && can(NAV_SHOWCASE.requiredPermission) && showcaseItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t(`nav.${NAV_SHOWCASE.label}`, NAV_SHOWCASE.label)}>
                  {showcaseItems.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title)}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {isDevMode && can(NAV_ERROR_PAGES.requiredPermission) && errorItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t(`nav.${NAV_ERROR_PAGES.label}`, NAV_ERROR_PAGES.label)}>
                  {errorItems.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={t(`nav.${item.title}`, item.title)}
                      onSelect={() => runCommand(() => navigate({ to: item.url }))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(`nav.${item.title}`, item.title)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
