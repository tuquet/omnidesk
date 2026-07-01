// Interfaces (type-only exports)
export type {
  Person,
  Attachment,
  Comment,
  PaginationParams,
  PaginatedResult,
} from './interfaces/common.types';

// API Response schema & error codes
export * from './api-response';
export * from './constants';
export * from './workflow';

// Moved from apps/core
export * from './apps';
export * from './browser-profile';
export * from './logger';
export * from './navigation';
export * from './rbac';

export interface PlatformAdapter {
  platform: 'desktop' | 'web';
  
  // IPC commands
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  runCommand?: (command: string, args: string[]) => Promise<any>;
  
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
