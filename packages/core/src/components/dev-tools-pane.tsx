import { useDevStore } from '../stores/use-dev-store';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@omnidesk/ui';
import { X, TerminalSquare, Activity, Network, FileTerminal } from 'lucide-react';

export function DevToolsPane() {
  const { toggleDevMode, isDevMode } = useDevStore();

  if (!isDevMode) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background border-t border-border">
      <Tabs defaultValue="terminal" className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 h-9 border-b border-border bg-muted/30">
          <TabsList className="h-8 bg-transparent p-0 gap-2">
            <TabsTrigger
              value="console"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-xs"
            >
              <TerminalSquare className="w-3.5 h-3.5 mr-1.5" />
              Console
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-xs"
            >
              <Network className="w-3.5 h-3.5 mr-1.5" />
              Network
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-xs"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full text-xs"
            >
              <FileTerminal className="w-3.5 h-3.5 mr-1.5" />
              Terminal
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDevMode}
            className="h-6 w-6 text-muted-foreground hover:bg-muted"
            title="Close Dev Tools"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <TabsContent value="console" className="flex-1 m-0 p-0 overflow-auto">
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No active sessions
          </div>
        </TabsContent>
        <TabsContent value="network" className="flex-1 m-0 p-0 overflow-auto">
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No network traffic recorded
          </div>
        </TabsContent>
        <TabsContent value="performance" className="flex-1 m-0 p-0 overflow-auto">
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No performance profiles
          </div>
        </TabsContent>
        <TabsContent value="terminal" className="flex-1 m-0 p-0 overflow-auto">
          <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
            <div className="p-2 rounded-md bg-muted/50 border border-border">
              <TerminalSquare className="w-6 h-6 text-muted-foreground/50" />
            </div>
            No terminal session selected
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
