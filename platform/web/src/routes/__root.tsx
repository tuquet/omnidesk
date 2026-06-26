import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useDevStore } from '@/stores/use-dev-store';
import type { AuthState } from '@omnidesk/app-auth';
import { Button } from '@omnidesk/ui';
import { ArrowLeft, Ghost } from 'lucide-react';
import { TitleBar } from '@omnidesk/app-core';
import { ResizeHandles } from '@omnidesk/app-core';

interface MyRouterContext {
  auth: AuthState;
}

function NotFound() {
  return (
    <div className="relative flex flex-1 w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Subtle animated background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Floating orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl [animation:pulse_4s_ease-in-out_infinite]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Ghost icon */}
        <div className="mb-6 animate-bounce [animation-duration:3s]">
          <Ghost className="h-16 w-16 text-muted-foreground/40" strokeWidth={1} />
        </div>

        {/* Large 404 */}
        <h1 className="bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent sm:text-[14rem]">
          404
        </h1>

        {/* Decorative line */}
        <div className="mt-2 mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Subtitle */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* Go Home button */}
        <Button asChild size="lg" className="gap-2 px-8">
          <Link to="/app/home">
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
      </div>

      {/* Bottom decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

import { useDeepLinkAuth } from '@omnidesk/app-auth';
import { AppLayout } from '@/app/layout';

function RootComponent() {
  const { setDevMode } = useDevStore();
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
      <ResizeHandles />
      <TitleBar />
      <div className="flex-1 flex flex-col min-h-0">
        <AppLayout />
      </div>
    </div>
  );
}

import { DefaultErrorFallback } from '@/components/error-boundary';

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => (
    <DefaultErrorFallback
      error={error instanceof Error ? error : new Error(String(error))}
      reset={reset}
    />
  ),
});
