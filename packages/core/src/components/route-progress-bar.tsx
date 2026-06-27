import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { usePlatform } from '../providers/platform-provider';
import { cn } from '@omnidesk/ui';


export function RouteProgressBar() {
  const status = useRouterState({ select: (s) => s.status });
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const platformApi = usePlatform();

  React.useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    let timeout: ReturnType<typeof setTimeout>;

    if (status === 'pending') {
      setVisible(true);
      setProgress(10);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const diff = Math.random() * 10;
          return Math.min(prev + diff, 90);
        });
      }, 150);
    } else {
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200);
      }, 300);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status]);

  if (!visible) return null;

  const topOffset = platformApi.platform === 'desktop' ? 32 : 0;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 w-full bg-transparent transition-opacity duration-300',
        progress === 100 ? 'opacity-0' : 'opacity-100',
      )}
      style={{
        top: `${topOffset}px`,
        height: `${3}px`,
        zIndex: 100,
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary bg-[size:200%_auto] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 8px hsl(var(--primary) / 0.5), 0 0 4px hsl(var(--primary) / 0.3)',
        }}
      />
    </div>
  );
}
