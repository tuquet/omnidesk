import { useState, useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    // Check initial state
    appWindow.isMaximized().then(setIsMaximized);

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  if (!isTauri()) return null;

  const appWindow = getCurrentWindow();

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => appWindow.minimize()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Minimize"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => appWindow.toggleMaximize()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Maximize"
      >
        {isMaximized ? (
          <Copy className="h-3 w-3 -scale-x-100" />
        ) : (
          <Square className="h-3 w-3" />
        )}
      </button>
      <button
        type="button"
        onClick={() => appWindow.close()}
        className="inline-flex h-8 w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
