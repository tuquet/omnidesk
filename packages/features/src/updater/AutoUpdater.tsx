import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import type { Update } from '@tauri-apps/plugin-updater';
import { Download, Rocket, X } from 'lucide-react';
import { Button } from '@omnidesk/ui';

export function AutoUpdater() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<{ downloaded: number; contentLength?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run in Tauri environment
    if (!(window as any).__TAURI_INTERNALS__) return;

    const checkForUpdates = async () => {
      try {
        const updateData = await check();
        if (updateData?.available) {
          setUpdate(updateData);
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };

    // Delay the check slightly so it doesn't block startup
    const timer = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    if (!update) return;

    try {
      setIsUpdating(true);
      setError(null);
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            setProgress({ downloaded: 0, contentLength });
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            setProgress({ downloaded, contentLength });
            break;
          case 'Finished':
            setProgress({ downloaded: contentLength, contentLength });
            break;
        }
      });

      // Relaunch the app after update
      await relaunch();
    } catch (err) {
      console.error('Failed to install update:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsUpdating(false);
    }
  };

  if (!update || dismissed) return null;

  const percent = progress && progress.contentLength 
    ? Math.round((progress.downloaded / progress.contentLength) * 100) 
    : 0;

  return (
    <div className="fixed bottom-12 right-6 z-50 w-72 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold leading-none tracking-tight text-sm">Cập nhật mới!</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Phiên bản {update.version} đã sẵn sàng.
                </p>
              </div>
            </div>
            {!isUpdating && (
              <button 
                onClick={() => setDismissed(true)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {update.body && !isUpdating && (
            <div className="mt-4 max-h-24 overflow-y-auto rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              {update.body}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              Lỗi cập nhật: {error}
            </div>
          )}

          <div className="mt-4">
            {isUpdating ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Đang tải xuống...</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button
                onClick={handleUpdate}
                className="w-full"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Cập nhật và Khởi động lại
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
