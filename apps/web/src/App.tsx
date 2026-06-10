import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@kbm/ui';
import { ThemeProvider } from 'next-themes';
import { queryClient } from './app/query-client';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import './app/globals.css';

// Create a new router instance
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/features/auth/stores/use-auth-store';

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
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export default function App() {
  const auth = useStore(authStore);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <RouterProvider router={router} context={{ auth }} />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackRouterDevtools router={router} position="bottom-right" />
    </QueryClientProvider>
  );
}
