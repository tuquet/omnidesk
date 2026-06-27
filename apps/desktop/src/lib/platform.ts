/**
 * Platform capability module.
 * Centralizes all platform-specific APIs and provides safe fallbacks for Web/Mobile.
 */

import type { Update } from '@tauri-apps/plugin-updater';

class PlatformAPI {
  /**
   * Helper to synchronously check if the current user agent belongs to a mobile OS.
   */
  private get isMobileUA(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
  }

  /**
   * Returns true if the application is running inside a Tauri Desktop container.
   */
  get isDesktop(): boolean {
    return ('__TAURI_INTERNALS__' in window) && !this.isMobileUA;
  }

  /**
   * Checks if the application is running on any Mobile device.
   */
  get isMobile(): boolean {
    return this.isMobileUA;
  }

  /**
   * Checks if the application is specifically running as a Tauri Mobile Native App.
   */
  get isTauriMobile(): boolean {
    return ('__TAURI_INTERNALS__' in window) && this.isMobileUA;
  }

  /**
   * Checks if the application is running in a standard Web Browser.
   */
  get isWeb(): boolean {
    return !('__TAURI_INTERNALS__' in window);
  }

  // ==========================================
  // File System & OS
  // ==========================================

  async openLogsFolder(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { appLogDir } = await import('@tauri-apps/api/path');
      const { openPath } = await import('@tauri-apps/plugin-opener');
      const logDir = await appLogDir();
      await openPath(logDir);
    } catch (err) {
      console.error('Failed to open logs folder:', err);
    }
  }

  async openUrl(url: string): Promise<void> {
    if (this.isDesktop || this.isTauriMobile) {
      try {
        const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
        await tauriOpenUrl(url);
      } catch (err) {
        console.error('Failed to open URL natively:', err);
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // ==========================================
  // Logging
  // ==========================================

  async logError(message: string): Promise<void> {
    if (this.isDesktop || this.isTauriMobile) {
      try {
        const { error } = await import('@tauri-apps/plugin-log');
        await error(message);
      } catch (err) {
        console.error('Failed to write native log:', err);
      }
    } else {
      console.error('[Web Fallback Log]:', message);
    }
  }

  // ==========================================
  // Window Management
  // ==========================================

  async closeWindow(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  }

  async minimizeWindow(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error('Failed to minimize window:', err);
    }
  }

  async toggleMaximize(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.error('Failed to toggle maximize:', err);
    }
  }

  async startDragging(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch (err) {
      console.error('Failed to start dragging:', err);
    }
  }

  async startResizeDragging(direction: string | number): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startResizeDragging(direction as never);
    } catch (err) {
      console.error('Failed to start resize dragging:', err);
    }
  }

  async resetWindowSize(width: number = 1280, height: number = 800): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const { LogicalSize } = await import('@tauri-apps/api/dpi');
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(width, height));
      await win.center();
    } catch (err) {
      console.error('Failed to reset window size:', err);
    }
  }

  async listenToWindowResized(callback: (isMaximized: boolean) => void): Promise<() => void> {
    if (!this.isDesktop) return () => {};
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      
      const unlisten = await win.onResized(async () => {
        const maximized = await win.isMaximized();
        callback(maximized);
      });

      // trigger initial check
      const maximized = await win.isMaximized();
      callback(maximized);

      return unlisten;
    } catch (err) {
      console.error('Failed to listen to window resize:', err);
      return () => {};
    }
  }

  // ==========================================
  // Updater & Process
  // ==========================================

  async checkUpdate(): Promise<Update | null> {
    if (!this.isDesktop) return null;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      return await check();
    } catch (err) {
      console.error('Failed to check for updates:', err);
      return null;
    }
  }

  async relaunchApp(): Promise<void> {
    if (!this.isDesktop) {
      window.location.reload();
      return;
    }
    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('Failed to relaunch app:', err);
      window.location.reload();
    }
  }

  async quitApp(): Promise<void> {
    if (!this.isDesktop) return;
    try {
      const { exit } = await import('@tauri-apps/plugin-process');
      await exit(0);
    } catch (err) {
      console.error('Failed to quit app:', err);
    }
  }

  // ==========================================
  // Deep Links
  // ==========================================

  async listenToDeepLink(callback: (urls: string[]) => void): Promise<() => void> {
    if (!this.isDesktop) return () => {};
    try {
      const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
      const { listen } = await import('@tauri-apps/api/event');
      
      const unlistenOpenUrl = await onOpenUrl((urls) => {
        callback(urls);
      });

      // Also listen to the custom event emitted by the single-instance plugin
      const unlistenInstance = await listen<string>('deep-link-received', (event) => {
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
  }
}

export const Platform = new PlatformAPI();
