import { createFileRoute } from '@tanstack/react-router';
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
} from '@omnidesk/ui';
import { WorkflowIcon, FolderOpenIcon, AlertCircleIcon, Loader2Icon, DownloadIcon, UploadCloudIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/api-client';
import { useWorkspaceStore } from '@omnidesk/core';
import { open } from '@tauri-apps/plugin-dialog';

import { WorkflowsTable, type Workflow } from '../components/workflows-table';
import { WorkflowsToolbar } from '../components/workflows-toolbar';

export const Route = createFileRoute('/')({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const { selectedWorkspacePath, setWorkspacePath } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // If no workspace is selected, we block the UI
  const isWorkspaceSelected = !!selectedWorkspacePath;

  const {
    data: workflows = [],
    isLoading,
    isRefetching,
  } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedWorkspacePath],
    queryFn: async () => {
      if (!selectedWorkspacePath) return [];
      
      // We first trigger a sync from local folder to SQLite
      await client.request({
        url: '/api/automa/workflows/sync/local',
        method: 'POST',
        data: { folder_path: selectedWorkspacePath },
      });

      // Then fetch from SQLite
      const { data, error } = await client.request({
        url: '/api/automa/workflows',
        method: 'GET',
      });
      if (error) throw error;
      return (data as Workflow[]) || [];
    },
    enabled: isWorkspaceSelected,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.request({
        url: `/api/automa/workflows/${id}`,
        method: 'DELETE',
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

  const pullMutation = useMutation({
    mutationFn: async () => {
      // In future, this will call actual git pull on the selected workspace
      const { data, error } = await client.request({
        url: '/api/git/pull',
        method: 'POST',
        data: { path: selectedWorkspacePath },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Pulled latest workflows from Git');
      queryClient.invalidateQueries({ queryKey: ['workflows', selectedWorkspacePath] });
    },
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      // In future, this will call actual git commit and push
      const { data, error } = await client.request({
        url: '/api/git/push',
        method: 'POST',
        data: { path: selectedWorkspacePath },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Committed and Pushed workflows to Git'),
  });

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        wf.name?.toLowerCase().includes(q) ||
        wf.description?.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
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
  }, [workflows, searchQuery, sortBy, sortOrder]);

  const handleSelectWorkspace = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Workspace Folder',
      });
      if (selected && typeof selected === 'string') {
        setWorkspacePath(selected);
      }
    } catch (e) {
      toast.error('Failed to open folder picker');
    }
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <PageContainer>
      {/* Blocking Modal for Workspace Selection */}
      <Dialog open={!isWorkspaceSelected}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <div className="bg-muted/50 px-6 py-4 border-b">
            <DialogHeader>
              <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <FolderOpenIcon className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center text-lg">Select Workspace</DialogTitle>
              <DialogDescription className="text-center">
                You must select a local folder to manage your workflows. This folder will act as your Git repository.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6">
            <Alert className="bg-muted/50 text-foreground border-primary/20 mb-6">
              <AlertCircleIcon className="h-4 w-4 text-primary" />
              <AlertTitle className="font-semibold text-primary">Why is this required?</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-2">
                OmniDesk manages your workflows as `.json` files inside a local folder. This enables you to version control them using Git, and sync them effortlessly across devices.
              </AlertDescription>
            </Alert>
            
            <Button
              className="w-full font-medium"
              onClick={handleSelectWorkspace}
            >
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
          
          <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => pullMutation.mutate()}
            disabled={pullMutation.isPending || pushMutation.isPending || !isWorkspaceSelected}
          >
            <DownloadIcon className={`mr-2 h-4 w-4 ${pullMutation.isPending ? 'animate-bounce' : ''}`} />
            Git Pull
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-sky-500 hover:bg-sky-600 text-white"
            onClick={() => pushMutation.mutate()}
            disabled={pullMutation.isPending || pushMutation.isPending || !isWorkspaceSelected}
          >
            <UploadCloudIcon className={`mr-2 h-4 w-4 ${pushMutation.isPending ? 'animate-pulse' : ''}`} />
            Git Push
          </Button>
        </div>
      </PageHeader>

      {isWorkspaceSelected && (
        <div className="flex flex-col gap-4">
          <WorkflowsToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <WorkflowsTable
            workflows={filteredWorkflows}
            isLoading={isLoading || isRefetching}
            onEdit={(wf) => toast.info(`Edit ${wf.name}`)}
            onDelete={(id) => setWorkflowToDelete(id)}
            onRun={(id) => toast.info(`Running ${id}`)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workflow? This will soft-delete it from the
              database and remove it from all synced profiles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => workflowToDelete && deleteMutation.mutate(workflowToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}
