import { createFileRoute } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from '@omnidesk/ui';
import { Activity, CheckCircle2, Clock, TerminalSquare, Server } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">
          Orchestrator Overview
        </h1>
        <p className="text-muted-foreground text-sm">
          Real-time automation engine metrics and execution logs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-card shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">1,248</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">98.5%</div>
            <p className="text-xs text-muted-foreground mt-1">3 failed in last 24h</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
            <Server className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">14 / 20</div>
            <p className="text-xs text-muted-foreground mt-1">6 available for jobs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-card shadow-sm border-border/60 flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="h-5 w-5 text-primary" />
              Live Execution Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 rounded-md bg-[#0D1117] p-4 text-sm font-mono text-gray-300 overflow-y-auto max-h-[300px] border border-border/50">
              <div className="flex flex-col gap-1.5">
                <div className="text-blue-400">
                  [10:42:01] INFO{' '}
                  <span className="text-gray-300">Engine started orchestrating Workflow #42</span>
                </div>
                <div className="text-blue-400">
                  [10:42:02] INFO{' '}
                  <span className="text-gray-300">Allocated Browser Profile ID: 9021</span>
                </div>
                <div className="text-yellow-400">
                  [10:42:03] WARN{' '}
                  <span className="text-gray-300">Profile 9021 took 1.2s to initialize</span>
                </div>
                <div className="text-green-400">
                  [10:42:04] SUCCESS{' '}
                  <span className="text-gray-300">Automa injected. Executing blocks...</span>
                </div>
                <div className="text-blue-400">
                  [10:42:05] INFO <span className="text-gray-300">Block "New Tab" completed</span>
                </div>
                <div className="text-blue-400">
                  [10:42:06] INFO{' '}
                  <span className="text-gray-300">Block "Extract Data" running...</span>
                </div>
                <div className="text-green-400">
                  [10:42:08] SUCCESS{' '}
                  <span className="text-gray-300">
                    Block "Extract Data" completed. Found 12 items.
                  </span>
                </div>
                <div className="text-emerald-500">
                  [10:42:09] DONE{' '}
                  <span className="text-gray-300">
                    Workflow #42 completed successfully. Session closed.
                  </span>
                </div>
                <div className="text-blue-400 animate-pulse mt-2">_</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Active Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: 'Daily Data Scrape',
                  time: 'Every day at 00:00',
                  status: 'Active',
                  next: 'In 8 hours',
                },
                {
                  name: 'Health Check Login',
                  time: 'Every 30 minutes',
                  status: 'Active',
                  next: 'In 5 mins',
                },
                {
                  name: 'Weekly Report Generator',
                  time: 'Sunday at 23:59',
                  status: 'Paused',
                  next: '-',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.time}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-semibold ${item.status === 'Active' ? 'text-emerald-500' : 'text-muted-foreground'}`}
                    >
                      {item.status}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.next}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
