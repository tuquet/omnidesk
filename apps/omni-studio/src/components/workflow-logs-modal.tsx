import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea, Badge, Skeleton, cn } from '@omnidesk/ui';;
import { client } from '@/lib/api-client';
import { getWorkflowRuns, getRunLogs } from '@omnidesk/types/client';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlayCircleIcon } from 'lucide-react';
import Editor from '@monaco-editor/react';

import type { WorkflowRun, WorkflowLog } from '@omnidesk/types';

interface WorkflowLogsModalProps {
  workflowId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowLogsModal({ workflowId, isOpen, onOpenChange }: WorkflowLogsModalProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Fetch runs
  const { data: runs = [], isLoading: isRunsLoading } = useQuery<WorkflowRun[]>({
    queryKey: ['workflow-runs', workflowId],
    queryFn: async () => {
      if (!workflowId) return [];
      const { data, error } = await getWorkflowRuns({
        client,
        path: { id: workflowId },
      });
      if (error) throw error;
      return (data as WorkflowRun[]) || [];
    },
    enabled: !!workflowId && isOpen,
    // Poll every 3 seconds if modal is open, to catch new runs
    refetchInterval: 3000,
  });

  // Automatically select the first run if none is selected and runs load
  useEffect(() => {
    if (runs && runs.length > 0 && !selectedRunId) {
      setSelectedRunId(runs[0]?.id || null);
    }
  }, [runs, selectedRunId]);

  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const isRunActive = selectedRun?.status === 'RUNNING';

  // Fetch logs for selected run
  const { data: logs = [], isLoading: isLogsLoading } = useQuery<WorkflowLog[]>({
    queryKey: ['workflow-logs', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return [];
      const { data, error } = await getRunLogs({
        client,
        path: { run_id: selectedRunId },
      });
      if (error) throw error;
      return (data as WorkflowLog[]) || [];
    },
    enabled: !!selectedRunId && isOpen,
    // Auto-refresh if the run is currently running
    refetchInterval: isRunActive ? 1000 : false,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Workflow Logs & History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-row w-full h-full rounded-b-lg overflow-hidden">
          {/* Left Panel: List of Runs */}
          <div className="w-[320px] bg-muted/10 flex flex-col border-r shrink-0 min-h-0">
            <div className="p-4 border-b bg-muted/20 font-medium text-sm text-muted-foreground uppercase tracking-wider shrink-0">
              Execution History
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {isRunsLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : runs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No runs found for this workflow.
                </div>
              ) : (
                <div className="flex flex-col">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={cn(
                        'p-4 border-b cursor-pointer transition-colors hover:bg-muted/50',
                        selectedRunId === run.id
                          ? 'bg-muted/80 border-l-4 border-l-primary'
                          : 'border-l-4 border-l-transparent',
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {run.status === 'SUCCESS' && (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          )}
                          {run.status === 'ERROR' && (
                            <XCircleIcon className="w-4 h-4 text-destructive" />
                          )}
                          {run.status === 'RUNNING' && (
                            <PlayCircleIcon className="w-4 h-4 text-blue-500 animate-pulse" />
                          )}
                          <span className="font-semibold text-sm">
                            {run.status === 'SUCCESS'
                              ? 'Succeeded'
                              : run.status === 'ERROR'
                                ? 'Failed'
                                : 'Running'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground" title={run.started_at || undefined}>
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(run.started_at || Date.now()))}
                        </span>
                      </div>

                      {run.profile_id && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Worker: <span className="font-mono">{run.profile_id}</span>
                        </div>
                      )}

                      {(run as WorkflowRun & { ended_at?: string }).ended_at && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Intl.DateTimeFormat('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          }).format(new Date((run as WorkflowRun & { ended_at?: string }).ended_at as string))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Logs for Selected Run */}
          <div className="flex-1 flex flex-col min-w-0 bg-background min-h-0">
            <div className="p-4 border-b bg-muted/5 font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center justify-between shrink-0">
              <span>Block Execution Logs</span>
              {isRunActive && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
                >
                  Live Stream
                </Badge>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {!selectedRunId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a run to view logs
                </div>
              ) : isLogsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-12 w-5/6" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No block logs recorded for this run.
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Run Error Summary if exists */}
                  {selectedRun?.error_message && (
                    <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono whitespace-pre-wrap">
                      <strong>Workflow Error:</strong> {selectedRun.error_message}
                    </div>
                  )}

                  {/* Log Timeline */}
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={log.id} className="flex gap-4 relative">
                        {/* Timeline vertical line */}
                        {index !== logs.length - 1 && (
                          <div className="absolute top-6 left-[11px] bottom-[-24px] w-px bg-border z-0" />
                        )}

                        {/* Status Icon */}
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          {log.status === 'success' ? (
                            <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                              <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                            </div>
                          ) : log.status === 'error' ? (
                            <div className="w-6 h-6 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                              <XCircleIcon className="w-3.5 h-3.5 text-destructive" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Log Content */}
                        <div className="flex-1 bg-card border rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <span>{log.block_label}</span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-mono font-normal"
                              >
                                {log.block_id}
                              </Badge>
                            </div>
                            {log.duration_ms !== null && (
                              <span className="text-xs text-muted-foreground">
                                {log.duration_ms} ms
                              </span>
                            )}
                          </div>

                          {log.data && (
                            <div className="mt-2 h-48 border rounded-md overflow-hidden bg-background">
                              <Editor
                                height="100%"
                                defaultLanguage="json"
                                value={(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(log.data), null, 2);
                                  } catch {
                                    return log.data;
                                  }
                                })()}
                                theme="vs-dark"
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  wordWrap: 'on',
                                  tabSize: 2,
                                  lineNumbers: 'off',
                                  folding: true,
                                  contextmenu: false,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
