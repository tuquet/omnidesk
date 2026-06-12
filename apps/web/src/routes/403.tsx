import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';
import { ArrowLeft, Lock } from 'lucide-react';

export const Route = createFileRoute('/403')({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Subtle animated background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Floating orbs with red/rose tones */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 h-72 w-72 animate-pulse rounded-full bg-primary/5 blur-3xl dark:bg-primary/5" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl [animation:pulse_4.5s_ease-in-out_infinite] dark:bg-primary/5" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Lock icon with shake animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/5 [animation-duration:3s]" />
          <div className="relative rounded-full bg-muted/50 p-4">
            <Lock className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
          </div>
        </div>

        {/* Large 403 */}
        <h1 className="bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent sm:text-[14rem]">
          403
        </h1>

        {/* Decorative line */}
        <div className="mt-2 mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

        {/* Subtitle */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Forbidden
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
          You don&apos;t have permission to access this resource. If you believe this is an error,
          contact your administrator.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2 px-8" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
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
