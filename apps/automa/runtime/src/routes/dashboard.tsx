import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription, Card, CardHeader, CardTitle, CardContent, ScrollArea } from '@omnidesk/ui';
import { ActivityIcon, CpuIcon, MemoryStickIcon, TerminalIcon, ServerCrashIcon } from 'lucide-react';
import { ActivityIcon, CpuIcon, MemoryStickIcon, TerminalIcon, ServerCrashIcon } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const logs = [
    { time: '18:42:01', level: 'INFO', message: 'Runtime Engine started successfully on port 1421' },
    { time: '18:42:05', level: 'DEBUG', message: 'Connected to local SQLite database' },
    { time: '18:42:10', level: 'WARN', message: 'Realtime sync queue is empty' },
    { time: '18:45:00', level: 'INFO', message: 'Scheduler trigger: [Scrape Daily News]' },
    { time: '18:45:01', level: 'INFO', message: 'Allocating browser profile #12 (Proxy: US-NY-1)' },
    { time: '18:45:03', level: 'INFO', message: 'WebSocket connection established with Extension Bridge' },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Control Center</PageTitle>
            <PageDescription>Monitor system resources and active engine processes.</PageDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-500">Engine Online</span>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <CpuIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12%</div>
            <p className="text-xs text-muted-foreground">Normal load</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory (RAM)</CardTitle>
            <MemoryStickIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 GB</div>
            <p className="text-xs text-muted-foreground">Out of 16 GB</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">+3 in queue</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
            <ServerCrashIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Realtime Engine Logs</h3>
        </div>
        <Card className="flex-1 bg-black border-zinc-800 text-zinc-300 font-mono text-xs overflow-hidden shadow-inner">
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start hover:bg-white/5 px-1 rounded transition-colors">
                  <span className="text-zinc-500 mr-3 shrink-0">[{log.time}]</span>
                  <span className={`shrink-0 w-12 ${log.level === 'INFO' ? 'text-blue-400' : log.level === 'WARN' ? 'text-yellow-400' : log.level === 'ERROR' ? 'text-red-400' : 'text-zinc-400'}`}>
                    {log.level}
                  </span>
                  <span className="ml-2 text-zinc-300 break-words">{log.message}</span>
                </div>
              ))}
              <div className="flex items-start px-1 animate-pulse">
                <span className="text-zinc-500 mr-3 shrink-0">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
                <span className="text-zinc-400">Waiting for events...</span>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </PageContainer>
  );
}
