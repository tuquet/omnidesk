 
import { createFileRoute } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertTitle,
  AlertDescription,
  RunWorkflowModal,
  useConfirmDialog,
} from '@omnidesk/ui';
import { WorkflowIcon, FolderOpenIcon, AlertCircleIcon } from 'lucide-react';
import { useState, useMemo, useDeferredValue, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { useWorkspaceStore, usePlatform } from '@omnidesk/core';
import { WorkflowsTable, type Workflow } from '../components/workflows-table';
import { WorkflowsToolbar } from '../components/workflows-toolbar';
import { WorkflowJsonEditorModal } from '../components/workflow-json-editor-modal';
import { WorkflowLogsModal } from '../components/workflow-logs-modal';

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
    let unlistenFn: () => void;
    
    listen('workflows-synced', (event) => {
      const payload = event.payload as { count: number };
      if (payload.count > 0) {
        toast.info(`Extension online: Synced ${payload.count} workflow(s) to Studio`);
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
      }
    }).then((fn) => {
      unlistenFn = fn;
    });

    let unlistenConnFn: () => void;
    listen('extension-connections-changed', (event) => {
      const payload = event.payload as { count: number };
      setActiveExtensions(payload.count);
    }).then((fn) => {
      unlistenConnFn = fn;
    });

    return () => {
      if (unlistenFn) unlistenFn();
      if (unlistenConnFn) unlistenConnFn();
    };
  }, [queryClient]);

  const {
    data: workflows = [],
    isLoading,
    isRefetching,
  } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedWorkspacePath, viewMode],
    queryFn: async () => {
      if (!selectedWorkspacePath) return [];

      // We first trigger a sync from local folder to SQLite (only in active mode)
      if (viewMode === 'active') {
        await client.request({
          url: '/api/automa/workflows/sync/local',
          method: 'POST',
          body: { folder_path: selectedWorkspacePath },
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Then fetch from SQLite
      const { data, error } = await client.request({
        url: viewMode === 'trash' ? '/api/automa/workflows/trash' : '/api/automa/workflows',
        method: 'GET',
      });
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
    enabled: isWorkspaceSelected,
    staleTime: 60 * 1000, // Do not sync on every window focus within 1 minute
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}`,
        method: 'DELETE',
        query: { workspacePath: selectedWorkspacePath }
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
    mutationFn: async (workflowJson: any) => {
      const { data, error } = await client.request({
        url: '/api/automa/workflows/sync/import',
        method: 'POST',
        body: workflowJson,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Workflow imported successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
    onError: (err) => {
      toast.error(`Failed to import workflow: ${err.message || String(err)}`);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}/restore`,
        method: 'POST',
        query: { workspacePath: selectedWorkspacePath }
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
        query: { workspacePath: selectedWorkspacePath }
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
        query: { workspacePath: selectedWorkspacePath }
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
        ids.map((id) => client.request({ url: `/api/automa/workflows/${id}`, method: 'DELETE', query: { workspacePath: selectedWorkspacePath } })),
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
          client.request({ url: `/api/automa/workflows/${id}/restore`, method: 'POST', query: { workspacePath: selectedWorkspacePath } }),
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
          client.request({ url: `/api/automa/workflows/${id}/force`, method: 'DELETE', query: { workspacePath: selectedWorkspacePath } }),
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
          client.request({
            url: `/api/automa/workflows/${wf.id}`,
            method: 'PUT',
            body: { ...wf, is_disabled: isDisabled },
          }),
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
        if (!deferredSearchQuery) return true;
        const q = deferredSearchQuery.toLowerCase();
        return wf.name?.toLowerCase().includes(q) || wf.description?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let aVal = a[sortBy as keyof Workflow] || '';
        let bVal = b[sortBy as keyof Workflow] || '';
        if (sortBy === 'is_disabled') {
          aVal = a.is_disabled || 0;
          bVal = b.is_disabled || 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [workflows, deferredSearchQuery, sortBy, sortOrder]);

  const handleSelectWorkspace = async () => {
    try {
      const selected: unknown = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
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

  const handleSortChange = useCallback((newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

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

  const handleDuplicate = useCallback((id: string) => {
    duplicateMutation.mutate(id);
  }, [duplicateMutation]);

  const handleRestore = useCallback((id: string) => {
    restoreMutation.mutate(id);
  }, [restoreMutation]);

  const handleForceDelete = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Force Delete workflow?',
      description: 'Are you sure you want to permanently delete this workflow? This cannot be undone.',
      destructive: true,
    });
    if (confirmed) {
      forceDeleteMutation.mutate(id);
    }
  }, [confirm, forceDeleteMutation]);

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
      description: 'Are you sure you want to permanently delete selected workflows? This cannot be undone.',
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
          <div className="bg-muted/50 px-6 py-4 border-b">
            <DialogHeader>
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <FolderOpenIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-lg">Select Workspace</DialogTitle>
              <DialogDescription className="text-center">
                You must select a local folder to manage your workflows. This folder will act as
                your Git repository.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            <Alert className="bg-muted/50 text-foreground border-primary/20 mb-6">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectWorkspace}
            className="text-xs"
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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
                  const parsed = JSON.parse(content);
                  const workflows = Array.isArray(parsed) ? parsed : [parsed];
                  
                  if (workflows.length === 0) {
                    throw new Error('No workflows found in file');
                  }

                  let successCount = 0;
                  for (const wf of workflows) {
                    if (!wf || typeof wf !== 'object') continue;
                    
                    // Assign missing required fields
                    wf.id = wf.id || wf.extId || crypto.randomUUID();
                    wf.name = wf.name || 'Imported Workflow';
                    wf.drawflow = wf.drawflow || {};
                    wf.settings = wf.settings || {};

                    importMutation.mutate(wf);
                    successCount++;
                  }
                  
                  if (successCount === 0) {
                    throw new Error('Invalid workflow format');
                  }
                } catch (e: any) {
                  toast.error(`Import failed: ${e.message || 'Invalid JSON format'}`);
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
        onRunSuccess={() => setRowSelection({})}
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
