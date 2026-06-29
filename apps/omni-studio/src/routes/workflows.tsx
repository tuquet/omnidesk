import { createFileRoute } from '@tanstack/react-router';
import { workflowApiUrl } from '@omnidesk/core';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  PageDescription,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@omnidesk/ui';
import {
  CheckCircle2Icon,
  TrashIcon,
  WorkflowIcon,
  Loader2Icon,
  DownloadIcon,
  UploadCloudIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const Route = createFileRoute('/workflows')({
  component: WorkflowsPage,
});

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  is_disabled: number | null;
  updated_at: string | null;
};

function WorkflowsPage() {
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: workflows = [],
    isLoading,
    error,
  } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetch(workflowApiUrl('/api/automa/workflows'));
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json() as Promise<Workflow[]>;
    },
    refetchInterval: 5000, // Poll every 5s to show 2-way sync
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(workflowApiUrl(`/api/automa/workflows/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete workflow');
    },
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setWorkflowToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setWorkflowToDelete(null);
    },
  });

  const pullMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(workflowApiUrl('/api/git/pull'), { method: 'POST' });
      if (!res.ok) throw new Error('Git pull failed');
      return (await res.json()) as unknown;
    },
    onSuccess: () => {
      toast.success('Pulled latest workflows from Git');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(workflowApiUrl('/api/git/push'), { method: 'POST' });
      if (!res.ok) throw new Error('Git push failed');
      return (await res.json()) as unknown;
    },
    onSuccess: () => toast.success('Committed and Pushed workflows to Git'),
    onError: (err) => toast.error(err.message),
  });

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Local Workflows Sync</PageTitle>
            <PageDescription>
              Monitor synced workflows from your Automa extension. Data is securely stored in your
              Local SQLite.
            </PageDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => pullMutation.mutate()}
              disabled={pullMutation.isPending}
            >
              <DownloadIcon
                className={`mr-2 h-4 w-4 ${pullMutation.isPending ? 'animate-bounce' : ''}`}
              />
              Git Pull
            </Button>
            <Button
              variant="default"
              onClick={() => pushMutation.mutate()}
              disabled={pushMutation.isPending}
            >
              <UploadCloudIcon
                className={`mr-2 h-4 w-4 ${pushMutation.isPending ? 'animate-pulse' : ''}`}
              />
              Git Push
            </Button>
          </div>
        </div>
      </PageHeader>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="grid-workflow-list"
      >
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 bg-muted/10">
            <Loader2Icon className="h-8 w-8 text-primary/70 animate-spin" />
            <h3 className="text-lg font-semibold tracking-tight mt-4">Loading workflows...</h3>
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-destructive/20 rounded-xl m-4 bg-destructive/5 text-destructive">
            <h3 className="text-lg font-semibold tracking-tight">Local Engine Offline</h3>
            <p className="text-sm mt-2">
              Cannot connect to the Local Engine (port 1422). Please ensure the backend is running.
            </p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 bg-muted/10 animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/20 shadow-inner">
              <WorkflowIcon className="h-8 w-8 text-primary/70" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">No workflows yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
              Create your first automated workflow in the browser to see it sync here automatically!
            </p>
          </div>
        ) : (
          workflows.map((wf, index) => (
            <Card
              key={wf.id}
              className="group hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-in fade-in zoom-in-95 fill-mode-backwards"
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{wf.name || 'Untitled Workflow'}</CardTitle>
                  <Badge
                    variant={!wf.is_disabled ? 'default' : 'secondary'}
                    className={
                      !wf.is_disabled
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 font-medium'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 font-medium'
                    }
                  >
                    {!wf.is_disabled ? 'active' : 'paused'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {wf.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-4 flex justify-between border-t mt-4">
                <div className="text-xs text-muted-foreground flex items-center">
                  <CheckCircle2Icon className="h-3 w-3 mr-1 text-green-500" />
                  Updated:{' '}
                  {wf.updated_at ? new Date(wf.updated_at).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    data-testid={`btn-delete-workflow-${wf.id}`}
                    onClick={() => setWorkflowToDelete(wf.id)}
                    title="Delete local copy"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

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
