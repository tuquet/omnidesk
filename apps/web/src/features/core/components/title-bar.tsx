import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';
import { openUrl } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { exit } from '@tauri-apps/plugin-process';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Bug } from 'lucide-react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@kbm/ui';
import { WindowControls } from './window-controls';

export function TitleBar() {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { i18n } = useTranslation();

  if (!isTauri()) return null;

  const openExternal = (url: string) => openUrl(url);

  const checkUpdate = async () => {
    try {
      const update = await check();
      if (update) {
        toast.info(`Found update ${update.version}`);
      } else {
        toast.success('You are on the latest version.');
      }
    } catch {
      toast.error('Error checking for updates.');
    }
  };

  const quitApp = () => exit(0);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div
      className="flex h-8 shrink-0 items-center border-b bg-background select-none"
      data-tauri-drag-region
    >
      {/* App icon + Menubar */}
      <div className="flex items-center">
        <div className="flex h-8 w-10 items-center justify-center">
          <Bug className="h-4 w-4 text-primary" />
        </div>

        <Menubar className="h-8 rounded-none border-none bg-transparent shadow-none">
          {/* ── File ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              File
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => navigate({ to: '/dashboard' })}>
                New Bug Report
                <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => openExternal('file://')}>
                Open Data Folder
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={quitApp}>
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
              <MenubarItem onClick={() => openExternal('http://127.0.0.1:1421/scalar')}>
                API Documentation
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                Developer Console
                <MenubarShortcut>Ctrl+Shift+I</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* ── Window ── */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 cursor-default px-2 py-1 text-xs font-normal">
              Window
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => getCurrentWindow().minimize()}>
                Minimize
                <MenubarShortcut>Ctrl+M</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => getCurrentWindow().toggleMaximize()}>
                Toggle Maximize
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={async () => {
                  const win = getCurrentWindow();
                  await win.setSize(new LogicalSize(1280, 800));
                  await win.center();
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
              <MenubarItem onClick={() => openExternal('https://github.com/tuquet/kill-bug-machine')}>
                Documentation
                <MenubarShortcut>F1</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => openExternal('https://github.com/tuquet/kill-bug-machine/issues')}>
                Report a Bug
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={checkUpdate}>
                Check for Updates...
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Drag region (spacer) */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Window controls */}
      <WindowControls />
    </div>
  );
}
