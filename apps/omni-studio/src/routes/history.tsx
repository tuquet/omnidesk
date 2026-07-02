import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button, Badge } from '@omnidesk/ui';
import { HistoryIcon, RefreshCwIcon, FileTextIcon } from 'lucide-react';
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

export const Route = createFileRoute('/history')({
  component: RunHistoryPage,
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

function RunHistoryPage() {
  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['workflows-lookup'],
    queryFn: async () => {
      const { data, error } = await listWorkflows({ client });
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
  });

  const { data: runs = [], isLoading, refetch, isRefetching } = useQuery<EngineRun[]>({
    queryKey: ['run-history'],
    queryFn: async () => {
      const res = await fetch(`${ENGINE_API_URL}/api/engine/runs`);
      if (!res.ok) throw new Error('Failed to fetch runs');
      const allRuns: EngineRun[] = await res.json();
      return allRuns.filter(r => r.status.toUpperCase() !== 'LAUNCHING' && r.status.toUpperCase() !== 'RUNNING' && r.status.toUpperCase() !== 'PENDING').sort((a, b) => {
        // Sort descending by finished_at or started_at
        const timeA = new Date(a.finished_at || a.started_at || 0).getTime();
        const timeB = new Date(b.finished_at || b.started_at || 0).getTime();
        return timeB - timeA;
      });
    },
  });

  const handleViewLog = (runId: string) => {
    // In future, open log modal 
    alert(`View logs for run ${runId} (Coming soon)`);
  };

  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'FAILED':
      case 'ERROR':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'TIMEOUT':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle className="flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-primary" />
          Run History
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
              <TableHead>Finished At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No historical runs found.
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
                      {run.finished_at ? new Date(run.finished_at).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewLog(run.id)}>
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Logs
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
