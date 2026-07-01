import type { PlatformAdapter } from '@omnidesk/types';

export const webAdapter: PlatformAdapter = {
  platform: 'web',

  invoke: async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    console.warn(`[WebAdapter] Ignored Tauri invoke: ${cmd}`, args);
    return null as T;
  },

  convertFileSrc: (path: string): string => {
    return path;
  },

  getAppDataDir: async (): Promise<string> => {
    console.warn('[WebAdapter] getAppDataDir not supported on web');
    return '/';
  },

  listen: async <T>(event: string, _callback: (payload: T) => void): Promise<() => void> => {
    console.warn(`[WebAdapter] Ignored Tauri listen: ${event}`);
    return () => {};
  },

  openDialog: async (): Promise<string | string[] | null> => {
    console.warn('[WebAdapter] openDialog not supported on web natively');
    return null;
  },

  quitApp: async (): Promise<void> => {
    console.warn('[WebAdapter] quitApp not supported on web');
  },

  relaunchApp: async (): Promise<void> => {
    window.location.reload();
  },

  checkUpdate: async (): Promise<unknown> => {
    return null;
  },

  openUrl: async (url: string): Promise<void> => {
    window.open(url, '_blank');
  },

  getOAuthRedirectUrl: () => `${window.location.origin}/auth/callback`,
  isOAuthSkipBrowserRedirect: () => false,

  listenToDeepLink: async (callback: (urls: string[]) => void): Promise<() => void> => {
    // In web, deep links are just normal page loads.
    // However, if the page URL matches the deep link pattern on load, we can invoke the callback.
    const url = window.location.href;
    if (url.includes('callback') || url.includes('auth')) {
      callback([url]);
    }
    return () => {};
  },

  window: {
    minimize: async () => {},
    maximize: async () => {},
    toggleMaximize: async () => {},
    close: async () => {
      window.close();
    },
    hide: async () => {},
    isMaximized: async () => document.fullscreenElement !== null,
    startDragging: async () => {},
    startResizeDragging: async () => {},
    resetSize: async () => {},
    listenToResized: async (callback) => {
      const onResize = () => callback(false);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    },
  },
};
