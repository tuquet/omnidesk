import { toast } from 'sonner';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../providers/platform-provider';
import { useAppConfig } from '../providers/config-provider';
import { useLayoutStore } from '../stores/use-layout-store';
import { useDevStore } from '../stores/use-dev-store';
import { useNavigate } from '@tanstack/react-router';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@omnidesk/ui';
import {
  Menu,
  Home,
  ChevronDown,
  PanelLeft,
  Play,
  Shield,
  TerminalSquare,
  Pin,
  FolderOpen,
} from 'lucide-react';
import { WindowControls } from './window-controls';

export function TitleBar() {
  const { setTheme, theme } = useTheme();
  const { i18n } = useTranslation();
  const platformApi = usePlatform();
  const { config } = useAppConfig();
  const { toggleSidebar, sidebarOpen } = useLayoutStore();
  const { toggleDevMode, isDevMode } = useDevStore();
  const [isPinned, setIsPinned] = useState(false);
  const navigate = useNavigate();

  if (platformApi.platform !== 'desktop') return null;

  const checkUpdate = async () => {
    try {
      const update = (await platformApi.checkUpdate()) as { version: string } | null | undefined;
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

  const handleTogglePin = async () => {
    try {
      const newState = !isPinned;
      await platformApi.invoke('toggle_always_on_top', { alwaysOnTop: newState });
      setIsPinned(newState);
      toast.success(newState ? 'Window pinned to top' : 'Window unpinned');
    } catch {
      toast.error('Could not toggle pin state');
    }
  };

  return (
    <div className="flex h-[38px] shrink-0 items-center justify-between border-b bg-background select-none relative z-50">
      {/* ── Left Section: Menu & Workspace ── */}
      <div className="flex items-center pl-2 gap-1 z-10" data-tauri-drag-region>
        <Menubar className="h-7 rounded-md border-none bg-transparent shadow-none p-0">
          <MenubarMenu>
            <MenubarTrigger className="h-7 w-8 px-0 flex justify-center cursor-default data-[state=open]:bg-muted hover:bg-muted focus:bg-muted">
              <Menu className="h-4 w-4 text-muted-foreground" />
            </MenubarTrigger>
            <MenubarContent align="start" sideOffset={4}>
              {/* File */}
              <MenubarSub>
                <MenubarSubTrigger>File</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem
                    onClick={async () => {
                      try {
                        await platformApi.invoke('open_app_folder');
                      } catch (e) {
                        toast.error('Could not open app folder: ' + String(e));
                      }
                    }}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open App Folder
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => platformApi.quitApp()}>
                    Quit
                    <MenubarShortcut>Ctrl+Q</MenubarShortcut>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>

              {/* Edit */}
              <MenubarSub>
                <MenubarSubTrigger>Edit</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => document.execCommand('undo')}>
                    Undo<MenubarShortcut>Ctrl+Z</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => document.execCommand('redo')}>
                    Redo<MenubarShortcut>Ctrl+Y</MenubarShortcut>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => document.execCommand('cut')}>
                    Cut<MenubarShortcut>Ctrl+X</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => document.execCommand('copy')}>
                    Copy<MenubarShortcut>Ctrl+C</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => document.execCommand('paste')}>
                    Paste<MenubarShortcut>Ctrl+V</MenubarShortcut>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>

              {/* View */}
              <MenubarSub>
                <MenubarSubTrigger>View</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={toggleFullscreen}>
                    Toggle Fullscreen<MenubarShortcut>F11</MenubarShortcut>
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
                </MenubarSubContent>
              </MenubarSub>

              {/* Help */}
              <MenubarSub>
                <MenubarSubTrigger>Help</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem onClick={() => platformApi.openUrl(config.githubRepo || '')}>
                    Documentation
                    <MenubarShortcut>F1</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem onClick={() => platformApi.openUrl(config.apiDocsUrl || '')}>
                    API Documentation
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={() => platformApi.openUrl(config.githubIssues || '')}>
                    Report a Bug
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={checkUpdate}>Check for Updates...</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={`h-7 w-7 ${sidebarOpen ? 'bg-muted text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          title="Toggle Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        {/* Home */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/' })}
          className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-semibold tracking-wide text-foreground hover:bg-muted hidden sm:inline-flex"
            >
              My Workspace <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>My Workspace</DropdownMenuItem>
            <DropdownMenuItem>Create Workspace...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Center Section: Logo & App Name ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 pointer-events-none hidden md:flex">
        <img
          src={config.logoSrc || '/logo-gold.svg'}
          alt={`${config.appName || 'OmniDesk'} Logo`}
          className="h-4 w-4"
        />
        <span className="text-xs font-bold tracking-tight text-foreground">
          {config.appName || 'OmniDesk'}
        </span>
      </div>

      {/* ── Drag Region (Expands to fill empty space) ── */}
      <div
        className="flex-1 h-full"
        style={{ cursor: 'default' }}
        data-tauri-drag-region
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();

          if (e.detail >= 2) {
            platformApi.window.toggleMaximize();
          } else {
            platformApi.window.startDragging();
          }
        }}
      />

      {/* ── Right Section: View Toggles & Window Controls ── */}
      <div className="flex items-center gap-1 z-10 pr-2" data-tauri-drag-region>
        {/* Runner / Terminal */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          title="Runner"
        >
          <Play className="h-4 w-4" />
        </Button>

        {/* Auth / Shield */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          title="Security"
        >
          <Shield className="h-4 w-4" />
        </Button>

        {/* Environment Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 mx-1 text-xs text-muted-foreground bg-transparent border-border hover:bg-muted hidden md:inline-flex"
            >
              No Environment <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>No Environment</DropdownMenuItem>
            <DropdownMenuItem>Development</DropdownMenuItem>
            <DropdownMenuItem>Production</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Manage Environments...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dev Tools Active */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDevMode}
          className={`h-7 w-7 hidden sm:inline-flex ${isDevMode ? 'bg-muted text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          title={isDevMode ? 'Dev Tools (Active)' : 'Dev Tools'}
        >
          <TerminalSquare className="h-4 w-4" />
        </Button>

        {/* Pin (Always on top) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTogglePin}
          className={`h-7 w-7 mr-2 hidden sm:inline-flex ${isPinned ? 'bg-muted text-primary hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          title={isPinned ? 'Unpin Window' : 'Pin to Top'}
        >
          <Pin className="h-4 w-4" />
        </Button>

        <WindowControls />
      </div>
    </div>
  );
}
