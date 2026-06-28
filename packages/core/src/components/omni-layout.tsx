import React, { useEffect, useRef, useState } from 'react';
import {
  SidebarProvider,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  cn,
} from '@omnidesk/ui';
import { useLayoutStore } from '../stores/use-layout-store';
import { useDevStore } from '../stores/use-dev-store';
import { DevToolsPane } from './dev-tools-pane';
import { RouteProgressBar } from './route-progress-bar';
import type { ImperativePanelHandle } from 'react-resizable-panels';

export interface OmniLayoutProps {
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
}

export function OmniLayout({ sidebarContent, children }: OmniLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();
  const { isDevMode } = useDevStore();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isDragging = useRef(false);

  // Custom drag logic for sidebar
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX;
      let newWidth = startWidth + delta;
      if (newWidth < 240) newWidth = 240;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const mainArea = (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={{ '--sidebar-width': '100%' } as React.CSSProperties}
    >
      <div className="flex h-full w-full bg-background overflow-hidden relative">
        {/* Sidebar Area */}
        {sidebarContent && (
          <div
            className={cn(
              'flex-shrink-0 relative transition-[width,opacity] duration-200 ease-linear bg-sidebar',
              sidebarOpen ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden',
            )}
            style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
          >
            <div className="w-full h-full flex flex-col min-w-[240px]">{sidebarContent}</div>

            {/* Custom Resize Handle */}
            <div
              onMouseDown={startDrag}
              className={cn(
                'absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 hover:bg-border/80 transition-colors',
                !sidebarOpen && 'hidden',
              )}
            />
          </div>
        )}

        {/* Separator Line */}
        {sidebarContent && sidebarOpen && <div className="w-px h-full bg-border flex-shrink-0" />}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col relative bg-background">{children}</div>
      </div>
    </SidebarProvider>
  );

  return (
    <>
      <RouteProgressBar />
      <ResizablePanelGroup orientation="vertical" className="h-full w-full">
        <ResizablePanel
          defaultSize={isDevMode ? 70 : 100}
          minSize={30}
          className="flex flex-col relative min-h-0"
        >
          {mainArea}
        </ResizablePanel>
        {isDevMode && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={10} className="flex flex-col border-t-0">
              <DevToolsPane />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </>
  );
}
