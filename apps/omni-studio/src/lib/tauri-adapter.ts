
import type { PlatformAdapter } from '@omnidesk/types';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { IPC_EVENTS, OAUTH_REDIRECT } from '@omnidesk/types';

export const tauriAdapter: PlatformAdapter = {
  platform: 'desktop',

  invoke: async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    return invoke<T>(cmd, args);
  },

  convertFileSrc: (path: string): string => {
    return convertFileSrc(path);
  },

  getAppDataDir: async (): Promise<string> => {
    return appDataDir();
  },

  listen: async <T>(event: string, callback: (payload: T) => void): Promise<() => void> => {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<T>(event, (e) => callback(e.payload));
    return unlisten;
  },

  openDialog: async (options?: { directory?: boolean; multiple?: boolean; filters?: { name: string; extensions: string[] }[] }): Promise<string | string[] | null> => {
    const { open } = await import('@tauri-apps/plugin-dialog');
    return open(options) as Promise<string | string[] | null>;
  },

  quitApp: async (): Promise<void> => {
    const { exit } = await import('@tauri-apps/plugin-process');
    await exit(0);
  },

  relaunchApp: async (): Promise<void> => {
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  },

  checkUpdate: async (): Promise<unknown> => {
    const { check } = await import('@tauri-apps/plugin-updater');
    return check();
  },

  openUrl: async (url: string): Promise<void> => {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  },

  getOAuthRedirectUrl: () => OAUTH_REDIRECT,
  isOAuthSkipBrowserRedirect: () => true,

  listenToDeepLink: async (callback: (urls: string[]) => void): Promise<() => void> => {
    try {
      const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
      const { listen } = await import('@tauri-apps/api/event');

      const unlistenOpenUrl = await onOpenUrl((urls) => {
        callback(urls);
      });

      const unlistenInstance = await listen<string>(IPC_EVENTS.DEEP_LINK_RECEIVED, (event) => {
        callback([event.payload]);
      });

      return () => {
        unlistenOpenUrl();
        unlistenInstance();
      };
    } catch (err) {
      console.error('Failed to setup deep link listener:', err);
      return () => {};
    }
  },

  window: {
    minimize: async () => {
      const win = getCurrentWindow();
      await win.minimize();
    },
    maximize: async () => {
      const win = getCurrentWindow();
      await win.maximize();
    },
    toggleMaximize: async () => {
      const win = getCurrentWindow();
      await win.toggleMaximize();
    },
    close: async () => {
      const win = getCurrentWindow();
      await win.close();
    },
    hide: async () => {
      const win = getCurrentWindow();
      await win.hide();
    },
    isMaximized: async () => {
      const win = getCurrentWindow();
      return win.isMaximized();
    },
    startDragging: async () => {
      const win = getCurrentWindow();
      await win.startDragging();
    },
    startResizeDragging: async (direction: number) => {
      const win = getCurrentWindow();
      await win.startResizeDragging(direction as any);
    },
    resetSize: async (width: number, height: number) => {
      const { LogicalSize } = await import('@tauri-apps/api/dpi');
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(width, height));
      await win.center();
    },
    listenToResized: async (callback: (maximized: boolean) => void) => {
      const win = getCurrentWindow();

      const unlisten = await win.onResized(async () => {
        const maximized = await win.isMaximized();
        callback(maximized);
      });

      const maximized = await win.isMaximized();
      callback(maximized);

      return unlisten;
    },
  },
};
