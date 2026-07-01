import React, { createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

import type { PlatformAdapter } from '@omnidesk/types';

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
