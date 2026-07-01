import React from 'react';
import {
  SidebarProvider,
  SidebarInset,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@omnidesk/ui';
import { useLayoutStore } from '../stores/use-layout-store';
import { useDevStore } from '../stores/use-dev-store';
import { DevToolsPane } from './dev-tools-pane';
import { RouteProgressBar } from './route-progress-bar';
export interface OmniLayoutProps {
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
}

export function OmniLayout({ sidebarContent, children }: OmniLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();
  const { isDevMode } = useDevStore();
  const mainArea = (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      {sidebarContent}
      <SidebarInset className="overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col relative bg-background overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
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
