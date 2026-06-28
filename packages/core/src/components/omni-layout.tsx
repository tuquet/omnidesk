/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import React, { useEffect, useRef } from 'react';
import {
  SidebarProvider,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidebarPanelRef = useRef<any>(null);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;

    if (sidebarOpen) {
      if (panel.isCollapsed()) panel.expand();
    } else {
      if (!panel.isCollapsed()) panel.collapse();
    }
  }, [sidebarOpen]);

  const mainArea = (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={{ '--sidebar-width': '100%' } as React.CSSProperties}
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {sidebarContent && (
          <>
            <ResizablePanel
              ref={sidebarPanelRef}
              collapsible={true}
              collapsedSize={0}
              minSize={15}
              maxSize={40}
              defaultSize={20}
              onCollapse={() => {
                if (sidebarOpen) setSidebarOpen(false);
              }}
              onExpand={() => {
                if (!sidebarOpen) setSidebarOpen(true);
              }}
              className="flex flex-col relative min-h-0 bg-sidebar"
            >
              {sidebarContent}
            </ResizablePanel>
            <ResizableHandle withHandle className={sidebarOpen ? 'block' : 'hidden'} />
          </>
        )}
        <ResizablePanel minSize={30} className="flex flex-col relative min-h-0">
          <div className="flex flex-1 flex-col overflow-auto relative bg-background">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
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
