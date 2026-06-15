import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@omnidesk/ui';
import { BREADCRUMB_MAP, type BreadcrumbEntry } from '@/config';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';
import { useDevStore } from '@/stores/use-dev-store';
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
function resolveBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  // Exact hit – preferred path
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];

  // Generic fallback
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'app-store') {
    const trail: BreadcrumbEntry[] = [{ label: 'App Store', url: '/app-store' }];
    if (segments.length > 1) {
      trail.push({ label: humanize(segments[1] || ''), url: pathname });
    }
    return trail;
  }

  const trail: BreadcrumbEntry[] = [{ label: 'Dashboard', url: '/dashboard' }];
  let accumulated = '';
  for (const seg of segments) {
    accumulated += `/${seg}`;
    if (seg !== 'dashboard') {
      trail.push({ label: humanize(seg), url: accumulated });
    }
  }
  return trail;
}

export function SmartBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = React.useMemo(() => resolveBreadcrumbs(pathname), [pathname]);
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
                    {t(`nav.${item.label}`, item.label)}
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
                      {item.siblings?.map((sibling) => (
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
                    <Link to={item.url}>{t(`nav.${item.label}`, item.label)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
