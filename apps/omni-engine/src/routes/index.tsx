import { createFileRoute } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Badge, PageContainer, PageHeader, PageTitle } from '@omnidesk/ui';
import { Play, Activity, Loader2, Clock, Calendar, Zap, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useDashboardStore, dashboardActions } from '../stores/use-dashboard-store';

export const Route = createFileRoute('/')(  {
  component: DashboardPage,
});

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScheduleItem {
  id: string;
  name: string;
  cron_expression: string;
  workflow_id: string;
  profile_id: string | null;
  is_enabled: boolean;
  last_run_at: string | null;
  run_count: number;
}

interface RunItem {
  id: string;
  workflow_id: string;
  profile_id: string | null;
  schedule_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <PageContainer className="bg-background max-w-5xl mx-auto w-full">
      <PageHeader className="pb-6">
        <div>
          <PageTitle className="tracking-tight text-3xl font-bold">Command Center</PageTitle>
          <div className="text-base text-muted-foreground mt-2">
            Execute workflows and monitor active schedules.
          </div>
        </div>
      </PageHeader>

      <Tabs defaultValue="quick-run" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
          <TabsTrigger value="quick-run" className="flex items-center gap-2 text-sm font-medium">
            <Play className="w-4 h-4" />
            Quick Run
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2 text-sm font-medium">
            <Activity className="w-4 h-4" />
            Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-run">
          <QuickRunTab />
        </TabsContent>

        <TabsContent value="monitor">
          <MonitorTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// ─── Quick Run Tab ─────────────────────────────────────────────────────────────

function QuickRunTab() {
  const {
    isRunning,
    workflows,
    profiles,
    selectedWorkflow,
    selectedProfiles,
    isLoading
  } = useDashboardStore();

  useEffect(() => {
    dashboardActions.fetchInitialData();
  }, []);

  const selectedCount = Object.values(selectedProfiles).filter(Boolean).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="text-xl">Execution Order</CardTitle>
        <CardDescription>Select a workflow and target profiles to run immediately</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-3">
        <div className="flex flex-col gap-4">
          <label className="text-base font-medium leading-none flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
            Select Workflow
          </label>
          <Select
            value={selectedWorkflow || undefined}
            onValueChange={dashboardActions.setSelectedWorkflow}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full bg-background h-12">
              <SelectValue placeholder="-- Choose a Workflow --" />
            </SelectTrigger>
            <SelectContent>
              {workflows.length === 0 ? (
                <SelectItem value="loading" disabled>
                  {isLoading ? "Loading workflows..." : "No workflows found"}
                </SelectItem>
              ) : (
                workflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-base font-medium leading-none flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
              Target Profiles
            </label>
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {selectedCount} selected
            </span>
          </div>
          <ScrollArea className="h-64 border rounded-md bg-muted/10">
            <div className="p-2 flex flex-col gap-1">
              {profiles.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {isLoading ? "Loading profiles..." : "No profiles found. Start Omni Profile first."}
                </div>
              )}
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center space-x-3 p-3 hover:bg-muted rounded-md transition-colors cursor-pointer group"
                  onClick={() => dashboardActions.toggleProfile(p.id)}
                >
                  <Checkbox
                    id={`p-${p.id}`}
                    checked={!!selectedProfiles[p.id]}
                    onCheckedChange={() => dashboardActions.toggleProfile(p.id)}
                    className="data-[state=checked]:bg-primary h-5 w-5"
                  />
                  <label
                    htmlFor={`p-${p.id}`}
                    className="text-base font-medium leading-none cursor-pointer flex-1 group-hover:text-primary transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    {p.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t bg-muted/10">
        <Button
          size="lg"
          onClick={dashboardActions.runWorkflow}
          disabled={isRunning || isLoading || !selectedWorkflow || selectedCount === 0}
          className="w-full text-base font-bold h-14"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="mr-3 h-5 w-5" fill="currentColor" />
              EXECUTE WORKFLOW
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Monitor Tab ───────────────────────────────────────────────────────────────

function MonitorTab() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [recentRuns, setRecentRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitorData = useCallback(async () => {
    try {
      const ENGINE_API = import.meta.env.VITE_API_PORT
        ? `http://localhost:${import.meta.env.VITE_API_PORT}`
        : 'http://localhost:1424';

      const [schedulesRes, runsRes] = await Promise.all([
        fetch(`${ENGINE_API}/api/automa/schedules`).then(r => r.ok ? r.json() : []),
        fetch(`${ENGINE_API}/api/engine/runs`).then(r => r.ok ? r.json() : []),
      ]);

      setSchedules(Array.isArray(schedulesRes) ? schedulesRes : []);
      setRecentRuns(Array.isArray(runsRes) ? runsRes.slice(0, 10) : []);
    } catch {
      // API might not be available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchMonitorData]);

  const activeSchedules = schedules.filter(s => s.is_enabled);
  const runningRuns = recentRuns.filter(r => r.status === 'RUNNING' || r.status === 'LAUNCHING');

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeSchedules.length}</div>
              <div className="text-xs text-muted-foreground">Active Schedules</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{runningRuns.length}</div>
              <div className="text-xs text-muted-foreground">Running Now</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recentRuns.length}</div>
              <div className="text-xs text-muted-foreground">Recent Runs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Schedules */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Active Schedules</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchMonitorData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>Schedules managed from Omni Studio, executed here</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : activeSchedules.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No active schedules. Create schedules in Omni Studio.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{schedule.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{schedule.cron_expression}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{schedule.run_count} runs</div>
                      {schedule.last_run_at && (
                        <div>{new Date(schedule.last_run_at).toLocaleTimeString()}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="border-green-500/50 text-green-500 text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Runs</CardTitle>
          <CardDescription>Latest workflow execution results</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No runs yet. Execute a workflow or wait for a schedule to trigger.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <StatusDot status={run.status} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate font-mono">{run.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : 'Pending'}
                      </div>
                    </div>
                  </div>
                  <RunStatusBadge status={run.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'RUNNING' || status === 'LAUNCHING'
      ? 'bg-green-500 animate-pulse'
      : status === 'COMPLETED'
        ? 'bg-blue-500'
        : status === 'FAILED'
          ? 'bg-red-500'
          : 'bg-muted-foreground';

  return <div className={`h-2.5 w-2.5 rounded-full ${color}`} />;
}

function RunStatusBadge({ status }: { status: string }) {
  const variant = status === 'RUNNING' || status === 'LAUNCHING'
    ? 'default'
    : 'outline';

  const className =
    status === 'COMPLETED'
      ? 'border-blue-500/50 text-blue-500'
      : status === 'FAILED'
        ? 'border-red-500/50 text-red-500'
        : '';

  return (
    <Badge variant={variant} className={`text-xs ${className}`}>
      {status}
    </Badge>
  );
}
