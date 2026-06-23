import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider, Toaster } from '@omnidesk/ui';
import { ThemeProvider } from 'next-themes';
import { queryClient } from './app/query-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { ConfirmDialogProvider } from '@/components/confirm-dialog';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import './app/globals.css';

// Create a new router instance
import { useStore } from '@tanstack/react-store';
import { authStore, authActions } from '@omnidesk/app-auth';
import { useEffect } from 'react';

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // We'll provide it in the RouterProvider
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { isSupabaseConfigured } from './lib/supabase';
import { EnvSetupWarning } from '@/components/env-setup-warning';
import { Platform } from '@/lib/platform';

export default function App() {
  const auth = useStore(authStore);

  // Initialize Supabase auth on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sub = authActions.initialize();
    return () => {
      sub.then((subscription) => subscription.unsubscribe()).catch(console.error);
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <EnvSetupWarning />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <ConfirmDialogProvider>
              <RouterProvider router={router} context={{ auth }} />
            </ConfirmDialogProvider>
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
        {Platform.isWeb && <ReactQueryDevtools initialIsOpen={false} />}
        {Platform.isWeb && <TanStackRouterDevtools router={router} position="bottom-right" />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
