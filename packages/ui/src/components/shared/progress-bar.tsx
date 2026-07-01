import { cn } from '../../index';

/**
 * Lightweight progress bar (not from @omnidesk/ui).
 * Stays inside the consumer app to avoid touching the UI package.
 */
export function ProgressBar({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn('bg-muted relative h-2 w-full overflow-hidden rounded-full', className)}>
      <div
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
