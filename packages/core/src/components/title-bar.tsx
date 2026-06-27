import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../providers/platform-provider';
import { useAppConfig } from '../providers/config-provider';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@omnidesk/ui';
import { WindowControls } from './window-controls';


export function TitleBar() {
  const { setTheme, theme } = useTheme();
  const { i18n } = useTranslation();
  const platformApi = usePlatform();
  const { config } = useAppConfig();

  if (platformApi.platform !== 'desktop') return null;

  const checkUpdate = async () => {
    try {
      const update = await platformApi.checkUpdate() as { version: string } | null | undefined;
      if (update) {
        toast.info(`Found update ${update.version}`);
      } else {
        toast.success('You are on the latest version.');
      }
    } catch {
      toast.error('Error checking for updates.');
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div className="flex h-8 shrink-0 items-center border-b bg-background select-none">
      {/* App icon + Menubar */}
      <div className="flex items-center">
        <div className="flex h-8 w-10 items-center justify-center pointer-events-none">
          <img src="/logo-gold.svg" alt="OmniDesk Logo" className="h-4 w-4" />
        </div>

        <Menubar className="h-8 rounded-none border-none bg-transparent shadow-none">
          {/* ── File ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              File
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => platformApi.openUrl('file://')}>Open Data Folder</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => platformApi.quitApp()}>
                Quit
                <MenubarShortcut>Ctrl+Q</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── Edit ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              Edit
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => document.execCommand('undo')}>
                Undo
                <MenubarShortcut>Ctrl+Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => document.execCommand('redo')}>
                Redo
                <MenubarShortcut>Ctrl+Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => document.execCommand('cut')}>
                Cut
                <MenubarShortcut>Ctrl+X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => document.execCommand('copy')}>
                Copy
                <MenubarShortcut>Ctrl+C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => document.execCommand('paste')}>
                Paste
                <MenubarShortcut>Ctrl+V</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── View ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              View
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={toggleFullscreen}>
                Toggle Fullscreen
                <MenubarShortcut>F11</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                <MenubarShortcut>Ctrl+Shift+D</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
              >
                {i18n.language === 'vi' ? '🇺🇸 English' : '🇻🇳 Tiếng Việt'}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── Tools ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              Tools
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => platformApi.openUrl(config.apiDocsUrl)}>
                API Documentation
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── Window ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              Window
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => platformApi.window.minimize()}>
                Minimize
                <MenubarShortcut>Ctrl+M</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => platformApi.window.toggleMaximize()}>
                Toggle Maximize
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={async () => {
                  await platformApi.window.resetSize(1280, 800);
                }}
              >
                Reset Window Size
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── Help ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              Help
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => platformApi.openUrl(config.githubRepo)}>
                Documentation
                <MenubarShortcut>F1</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => platformApi.openUrl(config.githubIssues)}>Report a Bug</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={checkUpdate}>Check for Updates...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Drag region — mimics native Windows title bar behavior */}
      <div
        className="flex-1 h-full"
        style={{ cursor: 'default' }}
        data-tauri-drag-region
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();

          if (e.detail >= 2) {
            // Browser-native double-click detection (respects OS dblclick speed)
            platformApi.window.toggleMaximize();
          } else {
            platformApi.window.startDragging();
          }
        }}
      />

      {/* Window controls */}
      <WindowControls />
    </div>
  );
}
