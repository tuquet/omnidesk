import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@kbm/ui';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component. Receives error + reset function. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── Class Component (React requires class for error boundaries) ────────────

/**
 * Reusable ErrorBoundary — catches unhandled rendering errors and
 * displays a premium fallback UI with retry capability.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <RiskyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback:
 * <ErrorBoundary fallback={({ error, reset }) => <MyFallback />}>
 *   <RiskyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

// ─── Default Fallback UI ────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

/**
 * Premium error fallback UI — can also be used standalone
 * as TanStack Router's `errorComponent`.
 *
 * @example
 * ```tsx
 * // In a route definition:
 * export const Route = createFileRoute('/dashboard')({
 *   errorComponent: ({ error, reset }) => (
 *     <DefaultErrorFallback error={error} reset={reset} />
 *   ),
 * });
 * ```
 */
export function DefaultErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-48 w-48 animate-pulse rounded-full bg-destructive/5 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 bottom-1/4 h-64 w-64 rounded-full bg-destructive/5 blur-3xl [animation:pulse_4s_ease-in-out_infinite]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. You can try again or go back.
        </p>

        {/* Error details (dev) */}
        <details className="mb-6 w-full max-w-lg rounded-lg border bg-muted/30 text-left">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-muted-foreground">
            Error Details
          </summary>
          <pre className="overflow-auto px-4 py-3 text-xs text-destructive">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
