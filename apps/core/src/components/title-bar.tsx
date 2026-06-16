import { Platform } from '@/lib/platform';
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
} from '@omnidesk/ui';
import { WindowControls } from './window-controls';
import { GITHUB_REPO, GITHUB_ISSUES, API_DOCS_URL } from '@/config';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config';

export function TitleBar() {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { i18n } = useTranslation();

  if (!Platform.isDesktop) return null;

  const checkUpdate = async () => {
    try {
      const update = await Platform.checkUpdate() as { version: string } | null | undefined;
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
              <MenubarItem onClick={() => navigate({ to: DEFAULT_AUTHENTICATED_ROUTE })}>
                New Bug Report
                <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => Platform.openUrl('file://')}>Open Data Folder</MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => Platform.quitApp()}>
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
              <MenubarItem onClick={() => Platform.openUrl(API_DOCS_URL)}>
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
              <MenubarItem onClick={() => Platform.minimizeWindow()}>
                Minimize
                <MenubarShortcut>Ctrl+M</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => Platform.toggleMaximize()}>
                Toggle Maximize
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                onClick={async () => {
                  await Platform.resetWindowSize(1280, 800);
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
              <MenubarItem onClick={() => Platform.openUrl(GITHUB_REPO)}>
                Documentation
                <MenubarShortcut>F1</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => Platform.openUrl(GITHUB_ISSUES)}>Report a Bug</MenubarItem>
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
            Platform.toggleMaximize();
          } else {
            Platform.startDragging();
          }
        }}
      />

      {/* Window controls */}
      <WindowControls />
    </div>
  );
}
