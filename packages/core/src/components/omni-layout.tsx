import React from 'react';
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

export interface OmniLayoutProps {
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
}

export function OmniLayout({ sidebarContent, children }: OmniLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();
  const { isDevMode } = useDevStore();

  return (
    <>
      <RouteProgressBar />
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        {sidebarContent}
        <div className="flex flex-1 flex-col overflow-hidden bg-background w-full">
          {isDevMode ? (
            <ResizablePanelGroup orientation="vertical" className="h-full w-full">
              <ResizablePanel defaultSize={70} minSize={30} className="flex flex-col">
                <div className="flex-1 overflow-auto relative">{children}</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10} className="flex flex-col">
                <DevToolsPane />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-1 flex-col overflow-auto relative">{children}</div>
          )}
        </div>
      </SidebarProvider>
    </>
  );
}
