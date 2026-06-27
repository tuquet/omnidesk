import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';
import { ArrowLeft, ShieldAlert } from 'lucide-react';



export function Error403Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-background px-6 py-12">
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="mb-6 rounded-full bg-muted/50 p-4 ring-1 ring-border/50 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-2">
          403 Forbidden
        </h1>

        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
          You don&apos;t have permission to access this resource. If you believe this is an error, please contact your administrator.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row w-full sm:w-auto">
          <Button size="lg" className="gap-2 px-8 w-full sm:w-auto" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 px-8 w-full sm:w-auto">
            <Link to="/app/$appId" params={{ appId: 'home' }}>
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
