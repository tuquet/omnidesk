import { Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';;

import { ArrowRight, CloudOff, Database, Network } from 'lucide-react';

export function DesktopLanding({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background relative overflow-y-auto overflow-x-hidden px-6 py-12 text-center">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl [animation:pulse_4s_ease-in-out_infinite]" />

      <div className="relative z-10 max-w-3xl flex flex-col items-center">
        {/* Golden Obsidian Logo */}
        <div className="mb-8 flex items-center justify-center animate-in zoom-in duration-500">
          <img
            src="/logo-gold.svg"
            alt="OmniDesk Logo"
            className="h-28 w-28 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:drop-shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all duration-500 hover:scale-105"
          />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Welcome to OmniDesk
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Your unified workspace for productivity and automation. Built on a Local-First
          architecture, keeping your data secure and fast.
        </p>

        {/* System Status Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Network className="w-4 h-4 text-emerald-500" />
            <span>Local Core Running</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-4 h-4 text-emerald-500" />
            <span>SQLite Ready</span>
          </div>
          {!isAuthenticated && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm font-medium text-muted-foreground">
              <CloudOff className="w-4 h-4" />
              <span>Cloud Sync Disabled</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
          {isAuthenticated ? (
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all group"
            >
              <Link to="/">
                Go to Home
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all group"
              >
                <Link to="/">
                  Launch Local Workspace
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg rounded-full backdrop-blur-sm"
              >
                <Link to="/login">Connect to Cloud</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
