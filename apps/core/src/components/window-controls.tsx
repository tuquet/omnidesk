import { useState, useEffect } from 'react';
import { Platform } from '@/lib/platform';
import { Minus, Square, X, Copy } from 'lucide-react';

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!Platform.isDesktop) return;

    let unlistenFn: (() => void) | undefined;

    Platform.listenToWindowResized((maximized) => {
      setIsMaximized(maximized);
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  if (!Platform.isDesktop) return null;

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => Platform.minimizeWindow()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Minimize"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => Platform.toggleMaximize()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Maximize"
      >
        {isMaximized ? (
          <Copy className="h-3 w-3 -scale-x-100" strokeWidth={1.5} />
        ) : (
          <Square className="h-3 w-3" strokeWidth={1.5} />
        )}
      </button>
      <button
        type="button"
        onClick={() => Platform.closeWindow()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
