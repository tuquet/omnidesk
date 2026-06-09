import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('../features/dashboard'));
const IssuesPage = lazy(() => import('../features/issues'));
const CrawlerPage = lazy(() => import('../features/crawler'));
const McpPage = lazy(() => import('../features/mcp'));
const SettingsPage = lazy(() => import('../features/settings'));

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

import { AppLayout } from './layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'issues',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <IssuesPage />
          </Suspense>
        ),
      },
      {
        path: 'crawler',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CrawlerPage />
          </Suspense>
        ),
      },
      {
        path: 'mcp',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <McpPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);
