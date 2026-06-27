import React, { createContext, useContext, ReactNode } from 'react';

export interface PlatformAdapter {
  platform: 'web' | 'desktop';
  
  // IPC commands
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  
  // File system / Path
  convertFileSrc: (path: string) => string;
  getAppDataDir: () => Promise<string>;
  
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
  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
};
