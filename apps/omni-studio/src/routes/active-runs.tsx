import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button, Badge } from '@omnidesk/ui';
import { ActivityIcon, RefreshCwIcon, StopCircleIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ENGINE_API_URL } from '@omnidesk/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@omnidesk/ui';
import { client } from '@/lib/api-client';
import { listWorkflows } from '@omnidesk/types/client';
import type { Workflow } from '@omnidesk/types/client';

export const Route = createFileRoute('/active-runs')({
  component: ActiveRunsPage,
});

interface EngineRun {
  id: string;
  workflow_id: string;
  profile_id: string | null;
  schedule_id: string | null;
  status: string;
  started_at: string | null;
  finished_at: string | null;
}

function ActiveRunsPage() {
  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['workflows-lookup'],
    queryFn: async () => {
      const { data, error } = await listWorkflows({ client });
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
  });

  const { data: runs = [], isLoading, refetch, isRefetching } = useQuery<EngineRun[]>({
    queryKey: ['active-runs'],
    queryFn: async () => {
      const res = await fetch(`${ENGINE_API_URL}/api/engine/runs`);
      if (!res.ok) throw new Error('Failed to fetch runs');
      const allRuns: EngineRun[] = await res.json();
      return allRuns.filter(r => r.status.toUpperCase() === 'LAUNCHING' || r.status.toUpperCase() === 'RUNNING' || r.status.toUpperCase() === 'PENDING');
    },
    refetchInterval: 5000, // Refresh every 5s as requested
  });

  const handleStopRun = async (runId: string) => {
    // In a real implementation, we would call an Engine API to abort the run.
    // For now, it's a placeholder since stop API might not exist yet.
    alert(`Stop functionality for run ${runId} is not yet implemented on the Engine side.`);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-primary" />
          Active Runs
        </PageTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <div className="bg-card rounded-md border shadow-sm flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading active runs...
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No active workflows running at the moment.
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => {
                const wfName = workflows.find((w) => w.id === run.workflow_id)?.name || run.workflow_id;
                
                return (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{wfName}</TableCell>
                    <TableCell>{run.profile_id || 'Default'}</TableCell>
                    <TableCell>
                      {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleStopRun(run.id)}>
                        <StopCircleIcon className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
