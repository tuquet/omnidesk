import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useDevStore } from '@omnidesk/core';
import type { AuthState } from '@omnidesk/auth';
import { AppConfigProvider, type AppConfig } from '@omnidesk/core';
import * as config from '@/config';
import { useRBAC } from '@/hooks/use-rbac';
import { NotFoundPage } from '@omnidesk/features';
import { useDeepLinkAuth } from '@omnidesk/core';
import { DefaultErrorFallback } from '@omnidesk/ui';;

interface MyRouterContext {
  auth: AuthState;
}

function RootComponent() {
  const { setDevMode } = useDevStore();
  const rbac = useRBAC();
  useDeepLinkAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('dev')) {
      const dev = params.get('dev');
      if (dev === '1') setDevMode(true);
      else if (dev === '0') setDevMode(false);
    }
  }, [setDevMode]);

  return (
    <div className="relative flex h-screen flex-col bg-background">
      <AppConfigProvider
        config={
          {
            ...config,
            navMain: config.NAV_MAIN,
            navDocuments: config.NAV_DOCUMENTS,
            navSecondary: config.NAV_SECONDARY,
            navShowcase: config.NAV_SHOWCASE,
            navErrorPages: config.NAV_ERROR_PAGES,
            breadcrumbMap: config.BREADCRUMB_MAP,
            githubRepo: config.GITHUB_REPO,
            githubIssues: config.GITHUB_ISSUES,
            apiDocsUrl: config.API_DOCS_URL,
          } as unknown as AppConfig
        }
        rbac={rbac}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <Outlet />
        </div>
      </AppConfigProvider>
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, reset }) => (
    <DefaultErrorFallback
      error={error instanceof Error ? error : new Error(String(error))}
      reset={reset}
    />
  ),
});
