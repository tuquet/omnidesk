import { useState, useEffect } from 'react';
import { Platform } from '@/lib/platform';

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
    <div className="flex items-center gap-1 pr-2">
      {/* Minimize */}
      <button
        type="button"
        onClick={() => Platform.minimizeWindow()}
        className="inline-flex h-7 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Minimize"
      >
        <svg
          className="h-2.5 w-2.5"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
        >
          <line x1="1" y1="5" x2="9" y2="5" strokeWidth="1" />
        </svg>
      </button>

      {/* Maximize / Restore */}
      <button
        type="button"
        onClick={() => Platform.toggleMaximize()}
        className="inline-flex h-7 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Maximize"
      >
        {isMaximized ? (
          <svg
            className="h-2.5 w-2.5"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
          >
            <path d="M3.5 3.5 V 1.5 H 8.5 V 6.5 H 6.5" strokeWidth="1" />
            <rect x="1.5" y="3.5" width="5" height="5" strokeWidth="1" />
          </svg>
        ) : (
          <svg
            className="h-2.5 w-2.5"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
          >
            <rect x="1.5" y="1.5" width="7" height="7" strokeWidth="1" />
          </svg>
        )}
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={() => Platform.closeWindow()}
        className="inline-flex h-7 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#e81123] hover:text-white"
        aria-label="Close"
      >
        <svg
          className="h-2.5 w-2.5"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
        >
          <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" strokeWidth="1" />
        </svg>
      </button>
    </div>
  );
}
