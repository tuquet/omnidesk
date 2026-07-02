import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Alert, AlertTitle, AlertDescription, useConfirmDialog, ResizablePanelGroup, ResizablePanel, ResizableHandle, ScrollArea } from '@omnidesk/ui';
import { RunWorkflowModal } from '@omnidesk/features';;
import { WorkflowIcon, FolderOpenIcon, AlertCircleIcon } from 'lucide-react';
import { useState, useMemo, useDeferredValue, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { useWorkspaceStore, usePlatform } from '@omnidesk/core';
import { WorkflowsTable } from '../components/workflows-table';
import { FolderPanel } from '../components/folder-panel';
import type { Workflow } from '@omnidesk/types';
import {
  listWorkflows,
  importWorkflow,
  deleteWorkflow,
  updateWorkflow,
  type WorkflowPayload
} from '@omnidesk/types/client';
import { WorkflowsToolbar } from '../components/workflows-toolbar';
import { WorkflowJsonEditorModal } from '../components/workflow-json-editor-modal';
import { WorkflowLogsModal } from '../components/workflow-logs-modal';

const ImportWorkflowSchema = z.object({
  id: z.string().optional().transform(v => (v && v.trim() !== '') ? v : crypto.randomUUID()),
  name: z.string().default('Imported Workflow'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  folder_id: z.string().optional().nullable(),
  trigger: z.any().optional().nullable(),
  version: z.string().optional().nullable(),
  drawflow: z.object({
    nodes: z.any(),
    edges: z.any()
  }),
  settings: z.any().default({}),
  global_data: z.any().optional().nullable(),
  table_data: z.any().optional().nullable(),
  data_columns: z.any().optional().nullable(),
  content: z.string().optional().nullable(),
  connected_table: z.string().optional().nullable(),
  is_disabled: z.number().optional().nullable(),
  source: z.string().optional().nullable()
}).transform((data: any) => {
  // Automa logic: handle table/dataColumns
  data.table_data = data.table_data || data.data_columns;
  delete data.data_columns;
  return data;
});

export const Route = createFileRoute('/')({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const { confirm } = useConfirmDialog();
  const { selectedWorkspacePath, setWorkspacePath } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [workflowToRun, setWorkflowToRun] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeExtensions, setActiveExtensions] = useState<number>(0);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorWorkflowId, setEditorWorkflowId] = useState<string | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logsWorkflowId, setLogsWorkflowId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const platformApi = usePlatform();

  // If no workspace is selected, we block the UI
  const isWorkspaceSelected = !!selectedWorkspacePath;

  useEffect(() => {
    const unlistenSyncPromise = platformApi.listen('workflows-synced', (payload: { count: number }) => {
      if (payload.count > 0) {
        toast.info(`Extension online: Synced ${payload.count} workflow(s) to Studio`);
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        queryClient.invalidateQueries({ queryKey: ['workflow'] });
      }
    });

    const unlistenConnPromise = platformApi.listen('extension-connections-changed', (payload: { count: number }) => {
      setActiveExtensions(payload.count);
    });

    return () => {
      unlistenSyncPromise.then((fn) => fn());
      unlistenConnPromise.then((fn) => fn());
    };
  }, [queryClient, platformApi]);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedWorkspacePath, viewMode],
    queryFn: async () => {
      if (!selectedWorkspacePath) return [];

      // Fetch from SQLite directly
      // Note: We don't have a specific GET /trash endpoint in the generated SDK yet.
      // Assuming listWorkflows handles it, or we fallback to client.request for trash
      let result;
      if (viewMode === 'trash') {
        result = await client.request({
          url: '/api/automa/workflows/trash',
          method: 'GET',
        });
      } else {
        result = await listWorkflows({ client });
      }
      
      const data = result.data;
      const error = result.error;
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
    enabled: isWorkspaceSelected,
    staleTime: 60 * 1000, // Do not sync on every window focus within 1 minute
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteWorkflow({
        client,
        path: { id },
        // @ts-expect-error Typed query might not support this currently
        query: { workspacePath: selectedWorkspacePath },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
      setWorkflowToDelete(null);
    },
    onError: () => {
      setWorkflowToDelete(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (workflowJson: unknown) => {
      const { data, error } = await importWorkflow({
        client,
        body: workflowJson as WorkflowPayload,
        // @ts-expect-error typed query might not support this
        query: { workspacePath: selectedWorkspacePath },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Workflow imported successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
    onError: () => {
      // toast.error is handled globally by api-client.ts
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}/restore`,
        method: 'POST',
        query: { workspacePath: selectedWorkspacePath },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow restored successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const forceDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}/force`,
        method: 'DELETE',
        query: { workspacePath: selectedWorkspacePath },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
      setWorkflowToDelete(null);
    },
    onError: () => {
      setWorkflowToDelete(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}/duplicate`,
        method: 'POST',
        query: { workspacePath: selectedWorkspacePath },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Workflow duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) =>
          deleteWorkflow({
            client,
            path: { id },
            // @ts-expect-error typed query might not support this
            query: { workspacePath: selectedWorkspacePath },
          })
        ),
      );
    },
    onSuccess: () => {
      toast.success('Workflows deleted successfully');
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) =>
          client.request({
            url: `/api/automa/workflows/${id}/restore`,
            method: 'POST',
            query: { workspacePath: selectedWorkspacePath },
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success('Workflows restored successfully');
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const bulkForceDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) =>
          client.request({
            url: `/api/automa/workflows/${id}/force`,
            method: 'DELETE',
            query: { workspacePath: selectedWorkspacePath },
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success('Workflows permanently deleted');
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ ids, isDisabled }: { ids: string[]; isDisabled: number }) => {
      // First, we need to fetch each workflow and then update it, or if we have it in cache, we use that
      const selectedWfs = workflows.filter((wf) => ids.includes(wf.id));
      await Promise.all(
        selectedWfs.map((wf) =>
          updateWorkflow({
            client,
            path: { id: wf.id },
            body: { ...wf, is_disabled: isDisabled } as unknown as WorkflowPayload,
          })
        ),
      );
    },
    onSuccess: () => {
      toast.success('Workflows status updated');
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const filteredWorkflows = useMemo(() => {
    return workflows
      .filter((wf) => {
        if (activeFolderId && wf.folder_id !== activeFolderId) return false;
        if (!deferredSearchQuery) return true;
        const q = deferredSearchQuery.toLowerCase();
        return wf.name?.toLowerCase().includes(q) || wf.description?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let aVal: string | number = (a[sortBy as keyof Workflow] as string | number) ?? '';
        let bVal: string | number = (b[sortBy as keyof Workflow] as string | number) ?? '';
        if (sortBy === 'is_disabled') {
          aVal = a.is_disabled ? 1 : 0;
          bVal = b.is_disabled ? 1 : 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [workflows, deferredSearchQuery, sortBy, sortOrder, activeFolderId]);

  const handleSelectWorkspace = async () => {
    try {
      if (!platformApi.openDialog) return;
      const openDialogFn = platformApi.openDialog;
      const selected = await openDialogFn({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        setWorkspacePath(selected);
        // Persist to backend and restart app so DB is initialized in the new location
        await platformApi.invoke('update_storage_location', { newPath: selected });
      }
    } catch {
      toast.error('Failed to open folder picker');
    }
  };

  const handleSortChange = useCallback(
    (newSortBy: string) => {
      if (sortBy === newSortBy) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(newSortBy);
        setSortOrder('asc');
      }
    },
    [sortBy, sortOrder],
  );

  const handleEdit = useCallback((wf: Workflow) => {
    setEditorWorkflowId(wf.id);
    setIsEditorOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setWorkflowToDelete(id);
  }, []);

  const handleRun = useCallback((id: string) => {
    setWorkflowToRun(id);
  }, []);

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateMutation.mutate(id);
    },
    [duplicateMutation],
  );

  const handleRestore = useCallback(
    (id: string) => {
      restoreMutation.mutate(id);
    },
    [restoreMutation],
  );

  const handleForceDelete = useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: 'Force Delete workflow?',
        description:
          'Are you sure you want to permanently delete this workflow? This cannot be undone.',
        destructive: true,
      });
      if (confirmed) {
        forceDeleteMutation.mutate(id);
      }
    },
    [confirm, forceDeleteMutation],
  );

  const handleViewLogs = useCallback((id: string) => {
    setLogsWorkflowId(id);
    setIsLogsModalOpen(true);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Delete workflows?',
      description: 'Are you sure you want to delete selected workflows?',
      destructive: true,
    });
    if (confirmed) {
      bulkDeleteMutation.mutate(Object.keys(rowSelection));
    }
  }, [confirm, bulkDeleteMutation, rowSelection]);

  const handleBulkRestore = useCallback(() => {
    bulkRestoreMutation.mutate(Object.keys(rowSelection));
  }, [bulkRestoreMutation, rowSelection]);

  const handleBulkForceDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Force Delete workflows?',
      description:
        'Are you sure you want to permanently delete selected workflows? This cannot be undone.',
      destructive: true,
    });
    if (confirmed) {
      bulkForceDeleteMutation.mutate(Object.keys(rowSelection));
    }
  }, [confirm, bulkForceDeleteMutation, rowSelection]);

  return (
    <PageContainer>
      {/* Blocking Modal for Workspace Selection */}
      <Dialog open={!isWorkspaceSelected}>
        <DialogContent
          className="sm:max-w-[460px] p-0 overflow-hidden [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="bg-muted/50 px-4 py-3 border-b">
            <DialogHeader>
              <div className="mx-auto bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                <FolderOpenIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-lg">Select Workspace</DialogTitle>
              <DialogDescription className="text-center">
                You must select a local folder to manage your workflows. This folder will act as
                your Git repository.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-4">
            <Alert className="bg-muted/50 text-foreground border-primary/20 mb-4">
              <AlertCircleIcon className="h-4 w-4 text-primary" />
              <AlertTitle className="font-semibold text-primary">Why is this required?</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-2">
                OmniDesk manages your workflows as `.json` files inside a local folder. This enables
                you to version control them using Git, and sync them effortlessly across devices.
              </AlertDescription>
            </Alert>

            <Button className="w-full font-medium" onClick={handleSelectWorkspace}>
              <FolderOpenIcon className="mr-2 h-4 w-4" />
              Browse Folder...
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PageHeader>
        <PageTitle className="flex items-center gap-2 text-base md:text-lg">
          <WorkflowIcon className="w-4 h-4 text-primary" />
          Workflows Sync
          {activeExtensions > 0 && (
            <span
              className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20 ml-2 font-medium flex items-center gap-1.5"
              title={`${activeExtensions} Automa Extension(s) connected via WebSocket`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {activeExtensions} Connected
            </span>
          )}
        </PageTitle>
        <div className="flex gap-2">
          {isWorkspaceSelected && selectedWorkspacePath && (
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                try {
                  await platformApi.invoke('plugin:omni_tauri_core|open_folder', { path: selectedWorkspacePath });
                } catch {
                  // Fallback for direct invoke
                  try {
                    await platformApi.invoke('open_folder', { path: selectedWorkspacePath });
                  } catch {
                    toast.error('Failed to open workspace folder');
                  }
                }
              }}
              className="h-8 w-8"
              title="Open Workspace in Explorer"
            >
              <FolderOpenIcon className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectWorkspace}
            className="text-xs h-8"
            title={selectedWorkspacePath || 'Select Workspace'}
          >
            <FolderOpenIcon className="mr-2 h-3.5 w-3.5" />
            <span className="truncate max-w-[150px]">
              {selectedWorkspacePath ? selectedWorkspacePath.split(/[/\\]/).pop() : 'Select Folder'}
            </span>
          </Button>
        </div>
      </PageHeader>

      {isWorkspaceSelected && (
        <ResizablePanelGroup
          // @ts-expect-error react-resizable-panels typing missing direction
          direction="horizontal"
          className="h-[calc(100vh-140px)]"
        >
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <FolderPanel activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} />
          </ResizablePanel>
          <ResizableHandle className="mx-2" />
          <ResizablePanel defaultSize={80}>
            <ScrollArea className="h-full pr-2">
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <WorkflowsToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onAdd={() => {
                  setEditorWorkflowId(null);
                  setIsEditorOpen(true);
                }}
                onImport={(content) => {
                  try {
                    const rawParsed = JSON.parse(content);
                    const workflowsToProcess: any[] = [];

                    const processRaw = (raw: any) => {
                      if (!raw || typeof raw !== 'object') return;
                      workflowsToProcess.push(raw);
                      
                      if (raw.includedWorkflows) {
                        Object.keys(raw.includedWorkflows).forEach((workflowId) => {
                          const subWf = raw.includedWorkflows[workflowId];
                          if (subWf) {
                            subWf.id = workflowId;
                            workflowsToProcess.push(subWf);
                          }
                        });
                      }
                    };

                    if (Array.isArray(rawParsed)) {
                      rawParsed.forEach(processRaw);
                    } else {
                      processRaw(rawParsed);
                    }

                    if (workflowsToProcess.length === 0) {
                      throw new Error('No workflows found in file');
                    }

                    let successCount = 0;
                    for (const rawWf of workflowsToProcess) {
                      if (rawWf.extId && !rawWf.id) {
                        rawWf.id = rawWf.extId;
                      }
                      
                      const result = ImportWorkflowSchema.safeParse(rawWf);
                      
                      if (!result.success) {
                        const errorMessages = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
                        throw new Error(`Invalid format for "${rawWf.name || 'Unknown'}": ${errorMessages}`);
                      }

                      // If importing while inside a folder, assign that folder to the new workflow
                      const importData = result.data as WorkflowPayload;
                      if (activeFolderId && !importData.folder_id) {
                        importData.folder_id = activeFolderId;
                      }

                      importMutation.mutate(importData);
                      successCount++;
                    }

                    if (successCount === 0) {
                      throw new Error('Invalid workflow format');
                    }
                  } catch (e: unknown) {
                    const errMessage = e instanceof Error ? e.message : 'Invalid JSON format';
                    toast.error(`Import failed: ${errMessage}`);
                  }
                }}
              />
              {Object.keys(rowSelection).length > 0 && (
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md border border-border/50 text-sm">
                  <span className="px-2 text-muted-foreground">
                    {Object.keys(rowSelection).length} selected
                  </span>

                  {viewMode === 'active' ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          bulkUpdateStatusMutation.mutate({
                            ids: Object.keys(rowSelection),
                            isDisabled: 0,
                          })
                        }
                        disabled={bulkUpdateStatusMutation.isPending}
                      >
                        Enable
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          bulkUpdateStatusMutation.mutate({
                            ids: Object.keys(rowSelection),
                            isDisabled: 1,
                          })
                        }
                        disabled={bulkUpdateStatusMutation.isPending}
                      >
                        Disable
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleBulkRestore}
                        disabled={bulkRestoreMutation.isPending}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkForceDelete}
                        disabled={bulkForceDeleteMutation.isPending}
                      >
                        Force Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <WorkflowsTable
              workflows={filteredWorkflows}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRun={handleRun}
              onDuplicate={handleDuplicate}
              viewMode={viewMode}
              onRestore={handleRestore}
              onForceDelete={handleForceDelete}
              onViewLogs={handleViewLogs}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <Dialog open={!!workflowToDelete} onOpenChange={() => setWorkflowToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => workflowToDelete && deleteMutation.mutate(workflowToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RunWorkflowModal
        isOpen={!!workflowToRun}
        workflowId={workflowToRun}
        onClose={() => setWorkflowToRun(null)}
        onRunSuccess={() => {
          setRowSelection({});
          if (workflowToRun) {
            setLogsWorkflowId(workflowToRun);
            setIsLogsModalOpen(true);
            // Delay slightly to allow the modal to mount, then dispatch event to clear selection and auto-select newest
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('select-workflow-run', { detail: { runId: null } }));
            }, 100);
          }
        }}
      />

      <WorkflowJsonEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditorWorkflowId(null);
          queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
        }}
        workflowId={editorWorkflowId}
      />

      <WorkflowLogsModal
        workflowId={logsWorkflowId}
        isOpen={isLogsModalOpen}
        onOpenChange={(open) => {
          setIsLogsModalOpen(open);
          if (!open) setLogsWorkflowId(null);
        }}
      />
    </PageContainer>
  );
}
