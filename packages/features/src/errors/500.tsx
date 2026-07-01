import { Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';;
import { ArrowLeft, Bug, RefreshCw } from 'lucide-react';

export function Error500Page() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Subtle animated background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />

      {/* Floating orbs with purple/violet tones */}
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-72 w-72 animate-pulse rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-400/5" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl [animation:pulse_4s_ease-in-out_infinite] dark:bg-primary/5" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Bug icon with pulse ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/10 [animation-duration:2s]" />
          <div className="relative rounded-full bg-muted/50 p-4">
            <Bug className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
          </div>
        </div>

        {/* Large 500 with glitch effect */}
        <div className="relative">
          <h1 className="bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent sm:text-[14rem]">
            500
          </h1>
          {/* Glitch layers */}
          <h1
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent opacity-30 sm:text-[14rem] [animation:glitch-1_2.5s_ease-in-out_infinite]"
          >
            500
          </h1>
          <h1
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground via-foreground/80 to-foreground/20 bg-clip-text text-[10rem] leading-none font-black tracking-tighter text-transparent opacity-30 sm:text-[14rem] [animation:glitch-2_2.5s_ease-in-out_infinite]"
          >
            500
          </h1>
        </div>

        {/* Decorative line */}
        <div className="mt-2 mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Subtitle */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Internal Server Error
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
          Something went wrong on our end. We&apos;re looking into it. Please try again in a moment.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" className="gap-2 px-8" onClick={() => window.location.reload()}>
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

      {/* Glitch keyframes */}
      <style>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-3px, 2px); }
          40% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); }
          60% { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 1px); }
          80% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
        }
        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          15% { clip-path: inset(70% 0 10% 0); transform: translate(3px, 1px); }
          35% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, -1px); }
          55% { clip-path: inset(50% 0 20% 0); transform: translate(2px, 2px); }
          75% { clip-path: inset(30% 0 40% 0); transform: translate(-3px, -2px); }
        }
      `}</style>
    </div>
  );
}
