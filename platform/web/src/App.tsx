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
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 font-sans">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <h1 className="text-xl font-semibold tracking-tight">Environment Setup Required</h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              Ứng dụng yêu cầu cấu hình các tham số kết nối đám mây để khởi chạy các dịch vụ dữ liệu và xác thực.
            </p>
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-4 font-mono text-xs text-zinc-300 space-y-2">
              <p className="text-zinc-500 font-semibold mb-1"># Vui lòng cấu hình file .env ở gốc dự án:</p>
              <div>VITE_SUPABASE_URL=<span className="text-zinc-500">https://your-project.supabase.co</span></div>
              <div>VITE_SUPABASE_ANON_KEY=<span className="text-zinc-500">your-anon-key</span></div>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Sau khi định cấu hình file <code className="text-zinc-300 font-mono bg-zinc-950 px-1 py-0.5 rounded">.env</code>, bạn cần **khởi động lại dev server** để các thay đổi có hiệu lực.
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
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
        <ReactQueryDevtools initialIsOpen={false} />
        <TanStackRouterDevtools router={router} position="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
