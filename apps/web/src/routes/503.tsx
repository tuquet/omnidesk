import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@kbm/ui';
import { ArrowLeft, RefreshCw, ServerCrash } from 'lucide-react';

export const Route = createFileRoute('/503')({
  component: ServiceUnavailablePage,
});

function ServiceUnavailablePage() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Subtle animated background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Floating orbs with warm tones */}
      <div className="pointer-events-none absolute top-1/3 left-1/3 h-72 w-72 animate-pulse rounded-full bg-orange-500/5 blur-3xl dark:bg-orange-400/5" />
      <div className="pointer-events-none absolute right-1/3 bottom-1/3 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl [animation:pulse_5s_ease-in-out_infinite] dark:bg-amber-400/5" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Pulsing server icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/10 [animation-duration:2s]" />
          <div className="relative rounded-full bg-muted/50 p-4">
            <ServerCrash
              className="h-12 w-12 text-muted-foreground/60"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Large 503 */}
        <h1 className="bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent sm:text-[14rem]">
          503
        </h1>

        {/* Decorative line */}
        <div className="mt-2 mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

        {/* Subtitle */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Service Unavailable
        </h2>

        {/* Description */}
        <p className="mb-4 max-w-md text-base leading-relaxed text-muted-foreground">
          We&apos;re performing scheduled maintenance or experiencing high
          traffic. Our team is working to restore service.
        </p>

        {/* Animated loading dots */}
        <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Working on it</span>
          <span className="flex gap-0.5">
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms] [animation-duration:1.4s]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:200ms] [animation-duration:1.4s]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:400ms] [animation-duration:1.4s]" />
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 px-8">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
