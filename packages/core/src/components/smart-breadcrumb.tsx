import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@omnidesk/ui';;
import { useAppConfig } from '../providers/config-provider';
import type { BreadcrumbEntry } from '@omnidesk/types';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, Home } from 'lucide-react';
import { useDevStore } from '@omnidesk/core';
import { toast } from 'sonner';

/**
 * Fallback: humanize a raw URL segment when it is not in the breadcrumb map.
 */
function humanize(segment: string): string {
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Build a breadcrumb trail for any pathname.
 * 1. Exact match in BREADCRUMB_MAP → use it.
 * 2. Otherwise walk segments and build a generic trail.
 */
function resolveBreadcrumbs(
  pathname: string,
  BREADCRUMB_MAP: Record<string, BreadcrumbEntry[]> = {},
): BreadcrumbEntry[] {
  // Exact hit – preferred path
  if (BREADCRUMB_MAP && BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];

  // Generic fallback
  const segments = pathname.split('/').filter(Boolean);

  // If path is exactly /, just show Home
  if (pathname === '/') {
    return [{ label: 'Home', url: '/' }];
  }

  // If it's an app inside /app/:appId
  if (segments[0] === 'app' && segments[1] && segments[1] !== 'home') {
    const trail: BreadcrumbEntry[] = [
      { label: 'Home', url: '/' },
      { label: humanize(segments[1]), url: pathname },
    ];
    return trail;
  }

  if (segments[0] === 'app-store') {
    const trail: BreadcrumbEntry[] = [{ label: 'App Store', url: '/app-store' }];
    if (segments.length > 1) {
      trail.push({ label: humanize(segments[1] || ''), url: pathname });
    }
    return trail;
  }

  const trail: BreadcrumbEntry[] = [{ label: 'Home', url: '/' }];
  let accumulated = '';
  for (const seg of segments) {
    accumulated += `/${seg}`;
    if (seg !== 'home' && seg !== 'app') {
      trail.push({ label: humanize(seg), url: accumulated });
    }
  }
  return trail;
}

export function SmartBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const {
    config: { breadcrumbMap },
  } = useAppConfig();
  const resolvedItems = React.useMemo(
    () => resolveBreadcrumbs(pathname, breadcrumbMap),
    [pathname, breadcrumbMap],
  );
  const items = React.useMemo(() => {
    if (resolvedItems.length === 0) return [];
    if (resolvedItems[0]?.label !== 'Home') {
      return [{ label: 'Home', url: '/' }, ...resolvedItems];
    }
    return resolvedItems;
  }, [resolvedItems]);
  const { toggleDevMode } = useDevStore();
  const { t } = useTranslation();

  // Easter egg state
  const clickCountRef = React.useRef(0);
  const lastClickTimeRef = React.useRef(0);

  const handleBreadcrumbClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 500) {
      // Reset if more than 500ms since last click
      clickCountRef.current = 1;
    } else {
      clickCountRef.current += 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current === 10) {
      toggleDevMode();
      clickCountRef.current = 0; // Reset after trigger
      toast.success('Developer Mode toggled!');
    }
  };

  if (items.length === 0) return null;

  return (
    <Breadcrumb onClick={handleBreadcrumbClick}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const hasSiblings = !!item.siblings?.length;

          return (
            <React.Fragment key={`${item.url}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  /* ── Current page ── */
                  <BreadcrumbPage className="font-medium">
                    {item.label === 'Home' ? (
                      <Home className="size-4" />
                    ) : (
                      t(`nav.${item.label}`, item.label)
                    )}
                  </BreadcrumbPage>
                ) : hasSiblings ? (
                  /* ── Parent with sibling dropdown ── */
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground outline-none transition-colors hover:text-foreground">
                      <BreadcrumbLink asChild>
                        <span className="cursor-pointer">{t(`nav.${item.label}`, item.label)}</span>
                      </BreadcrumbLink>
                      <ChevronDownIcon className="size-3.5 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-44">
                      {item.siblings?.map((sibling: BreadcrumbEntry) => (
                        <DropdownMenuItem key={sibling.url} asChild>
                          <Link
                            to={sibling.url}
                            className="w-full cursor-pointer"
                            activeProps={{ className: 'font-semibold bg-accent' }}
                          >
                            {t(`nav.${sibling.label}`, sibling.label)}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  /* ── Normal parent link ── */
                  <BreadcrumbLink asChild>
                    <Link to={item.url} className="flex items-center">
                      {item.label === 'Home' ? (
                        <Home className="size-4" />
                      ) : (
                        t(`nav.${item.label}`, item.label)
                      )}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
