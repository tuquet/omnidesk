import React from 'react';
import { SidebarProvider, SidebarInset } from '@omnidesk/ui';
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
      className="min-h-0 h-full w-full"
    >
      {sidebarContent}
      <SidebarInset className="overflow-hidden min-h-0 h-full flex-1 w-full relative">
        <div className="flex-1 min-w-0 flex flex-col relative bg-background overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );

  return (
    <>
      <RouteProgressBar />
      <div className="flex flex-col relative h-full w-full min-h-0">
        <div className="flex-1 min-h-0 flex flex-col relative">
          {mainArea}
        </div>
        {isDevMode && (
          <div className="h-[30vh] min-h-[200px] border-t flex flex-col bg-background relative z-50">
            <DevToolsPane />
          </div>
        )}
      </div>
    </>
  );
}
