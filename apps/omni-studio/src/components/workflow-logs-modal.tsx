import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, Skeleton, cn, Button, ScrollArea } from '@omnidesk/ui';
import { client } from '@/lib/api-client';
import { getWorkflowRuns, getRunLogs, deleteWorkflowRun, deleteAllWorkflowRuns } from '@omnidesk/types/client';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PlayCircleIcon, TrashIcon } from 'lucide-react';
import Editor from '@monaco-editor/react';

import type { WorkflowRun, WorkflowLog } from '@omnidesk/types';

interface WorkflowLogsModalProps {
  workflowId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkflowLogsModal({ workflowId, isOpen, onOpenChange }: WorkflowLogsModalProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Listen to select-workflow-run events
  useEffect(() => {
    const handleSelectRun = (e: CustomEvent<{ runId: string | null }>) => {
      setSelectedRunId(e.detail.runId);
    };
    window.addEventListener('select-workflow-run', handleSelectRun as EventListener);
    return () => window.removeEventListener('select-workflow-run', handleSelectRun as EventListener);
  }, []);

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

  const deleteRunMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await deleteWorkflowRun({
        client,
        path: { run_id: runId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, runId) => {
      if (selectedRunId === runId) {
        setSelectedRunId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', workflowId] });
    },
  });

  const clearAllRunsMutation = useMutation({
    mutationFn: async () => {
      if (!workflowId) return;
      const { data, error } = await deleteAllWorkflowRuns({
        client,
        path: { id: workflowId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setSelectedRunId(null);
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', workflowId] });
    },
  });

  // Automatically select a valid run, or nullify if runs are empty
  useEffect(() => {
    if (!runs || isRunsLoading) return;
    
    if (runs.length === 0) {
      if (selectedRunId !== null) {
        setSelectedRunId(null);
      }
    } else {
      if (!selectedRunId || !runs.some(r => r.id === selectedRunId)) {
        setSelectedRunId(runs[0]!.id);
      }
    }
  }, [runs, selectedRunId, isRunsLoading]);

  const selectedRun = runs?.find((r) => r.id === selectedRunId);
  const isRunActive = selectedRun?.status === 'RUNNING';

  // Fetch logs for selected run
  const { data: logs = [], isLoading: isLogsLoading } = useQuery<WorkflowLog[]>({
    queryKey: ['workflow-logs', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return [];
      const { data, error } = await getRunLogs({
        client,
        path: { run_id: selectedRunId } as any,
      });
      if (error) throw error;
      return (data as WorkflowLog[]) || [];
    },
    enabled: !!selectedRunId && isOpen,
    // Auto-refresh if the run is currently running
    refetchInterval: isRunActive ? 1000 : false,
  });

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logs.length > 0 && isRunActive) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isRunActive]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-3 border-b shrink-0">
          <DialogTitle>Workflow Logs & History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-row w-full h-full rounded-b-lg overflow-hidden">
          {/* Left Panel: List of Runs */}
          <div className="w-[320px] bg-muted/10 flex flex-col border-r shrink-0 min-h-0">
            <div className="p-3 border-b bg-muted/20 font-medium text-sm text-muted-foreground uppercase tracking-wider shrink-0 flex items-center justify-between">
              <span>Execution History</span>
              {runs.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  title="Clear All Runs"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all runs for this workflow?')) {
                      clearAllRunsMutation.mutate();
                    }
                  }}
                  disabled={clearAllRunsMutation.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {isRunsLoading ? (
                <div className="p-3 flex flex-col gap-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : runs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No runs found for this workflow.
                </div>
              ) : (
                <div className="flex flex-col">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={cn(
                        'group p-3 pr-10 border-b cursor-pointer transition-colors hover:bg-muted/50 relative',
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this run?')) {
                              deleteRunMutation.mutate(run.id);
                            }
                          }}
                          disabled={deleteRunMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
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
            </ScrollArea>
          </div>

          {/* Right Panel: Logs for Selected Run */}
          <div className="flex-1 flex flex-col min-w-0 bg-background min-h-0">
            <div className="p-3 border-b bg-muted/5 font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center justify-between shrink-0">
              <span>Block Execution Logs</span>
              {isRunActive && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"
                >
                  Live
                </Badge>
              )}
            </div>
            <ScrollArea className="flex-1 min-h-0">
              {!selectedRunId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a run to view logs
                </div>
              ) : isLogsLoading ? (
                <div className="p-3 flex flex-col gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-12 w-5/6" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No block logs recorded for this run.
                </div>
              ) : (
                <div className="p-3 flex flex-col gap-6">
                  {/* Run Error Summary if exists */}
                  {selectedRun?.error_message && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono whitespace-pre-wrap">
                      <strong>Workflow Error:</strong> {selectedRun.error_message}
                    </div>
                  )}

                  {/* Log Timeline */}
                  <div className="flex flex-col gap-4">
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

                          {log.data && log.data !== 'null' && log.data !== '{}' ? (
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
                          ) : (
                            <div className="mt-2 text-[11px] text-muted-foreground/50 italic bg-muted/20 px-2 py-1 rounded w-fit border border-muted/30">
                              No output data
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
