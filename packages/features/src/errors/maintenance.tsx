import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';
import { ArrowLeft, Clock, RefreshCw, Wrench } from 'lucide-react';



export function MaintenancePage() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Subtle animated background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Floating orbs with emerald/green tones */}
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 animate-pulse rounded-full bg-primary/5 blur-3xl dark:bg-primary/5" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl [animation:pulse_5s_ease-in-out_infinite] dark:bg-primary/5" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Wrench icon with spin animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/5 [animation-duration:2.5s]" />
          <div className="relative rounded-full bg-muted/50 p-4">
            <Wrench
              className="h-12 w-12 text-muted-foreground/60 [animation:spin_8s_linear_infinite]"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Large maintenance text with gradient */}
        <h1 className="bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[5rem] leading-none font-black tracking-tighter text-transparent sm:text-[8rem]">
          Maintenance
        </h1>

        {/* Decorative line */}
        <div className="mt-2 mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Subtitle */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          We&apos;ll Be Right Back
        </h2>

        {/* Description */}
        <p className="mb-4 max-w-md text-base leading-relaxed text-muted-foreground">
          We&apos;re upgrading our systems. Be right back!
        </p>

        {/* Animated progress bar */}
        <div className="mb-4 h-1 w-64 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-emerald-500/60 via-emerald-400/80 to-emerald-500/60 [animation-duration:2s] [animation:progress-slide_2s_ease-in-out_infinite]" />
        </div>

        {/* Estimated time */}
        <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Usually takes less than 30 minutes</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2 px-8" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Check Status
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

      {/* Progress slide keyframes */}
      <style>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); width: 33%; }
          50% { transform: translateX(100%); width: 50%; }
          100% { transform: translateX(300%); width: 33%; }
        }
      `}</style>
    </div>
  );
}
