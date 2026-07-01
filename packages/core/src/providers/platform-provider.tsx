import React, { createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

export interface PlatformAdapter {
  platform: 'web' | 'desktop';
  
  // IPC commands
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  
  // File system / Path
  convertFileSrc: (path: string) => string;
  getAppDataDir: () => Promise<string>;
  
  // Events & Dialogs
  listen: <T>(event: string, callback: (payload: T) => void) => Promise<() => void>;
  openDialog?: (options?: { directory?: boolean; multiple?: boolean; title?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | string[] | null>;
  
  // Application lifecycle
  quitApp: () => Promise<void>;
  relaunchApp: () => Promise<void>;
  checkUpdate: () => Promise<any>;
  openUrl: (url: string) => Promise<void>;
  listenToDeepLink: (callback: (urls: string[]) => void) => Promise<() => void>;
  getOAuthRedirectUrl: () => string;
  isOAuthSkipBrowserRedirect: () => boolean;
  
  // Window management
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    hide: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    startDragging: () => Promise<void>;
    startResizeDragging: (direction: number) => Promise<void>;
    resetSize: (width: number, height: number) => Promise<void>;
    listenToResized: (callback: (maximized: boolean) => void) => Promise<() => void>;
  };
}

export const PlatformContext = createContext<PlatformAdapter | null>(null);

export const usePlatform = (): PlatformAdapter => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};

export interface PlatformProviderProps {
  adapter: PlatformAdapter;
  children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ adapter, children }) => {
  const wrappedAdapter: PlatformAdapter = {
    ...adapter,
    invoke: async <T,>(cmd: string, args?: Record<string, unknown>) => {
      try {
        return await adapter.invoke<T>(cmd, args);
      } catch (err) {
        toast.error(`Platform Error (${cmd})`, {
          description: err instanceof Error ? err.message : String(err)
        });
        throw err;
      }
    },
    checkUpdate: async () => {
      try {
        const update = await adapter.checkUpdate();
        if (update && update.downloadAndInstall) {
          const origDownload = update.downloadAndInstall;
          update.downloadAndInstall = async (onEvent: any) => {
            try {
              return await origDownload.call(update, onEvent);
            } catch (err) {
              toast.error('Platform Error (downloadAndInstall)', {
                description: err instanceof Error ? err.message : String(err)
              });
              throw err;
            }
          };
        }
        return update;
      } catch (err) {
        toast.error('Platform Error (checkUpdate)', {
          description: err instanceof Error ? err.message : String(err)
        });
        throw err;
      }
    }
  };

  return (
    <PlatformContext.Provider value={wrappedAdapter}>
      {children}
    </PlatformContext.Provider>
  );
};
