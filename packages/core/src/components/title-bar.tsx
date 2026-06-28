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
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@omnidesk/ui';
import {
  Menu,
  Home,
  ChevronDown,
  Search,
  Plus,
  MoreVertical,
  Sidebar,
  Columns3,
} from 'lucide-react';
import { WindowControls } from './window-controls';

export function TitleBar() {
  const { setTheme, theme } = useTheme();
  const { i18n } = useTranslation();
  const platformApi = usePlatform();
  const { config } = useAppConfig();

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
                        await platformApi.invoke('open_data_folder');
                      } catch (e) {
                        toast.error('Could not open data folder: ' + String(e));
                      }
                    }}
                  >
                    Open Data Folder
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

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-semibold tracking-wide text-foreground hover:bg-muted"
            >
              My Workspace <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>My Workspace</DropdownMenuItem>
            <DropdownMenuItem>Create Workspace...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Center Section: Logo & App Name ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2 pointer-events-none">
        <img src="/logo-gold.svg" alt="OmniDesk Logo" className="h-4 w-4" />
        <span className="text-xs font-bold tracking-tight text-foreground">OmniDesk</span>
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
      <div className="flex items-center gap-1 z-10" data-tauri-drag-region>
        <div className="flex items-center mr-2 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-foreground">
            <Sidebar className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-foreground">
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>

        <WindowControls />
      </div>
    </div>
  );
}
