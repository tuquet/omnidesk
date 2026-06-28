import { createFileRoute } from '@tanstack/react-router';
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
import { PlayIcon, EditIcon, CheckCircle2Icon, TrashIcon, WorkflowIcon } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/workflows')({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  const workflows = [
    {
      id: '1',
      name: 'Scrape Daily News',
      description: 'Runs every morning at 8AM to fetch tech news.',
      status: 'active',
    },
    {
      id: '2',
      name: 'Auto Reply Emails',
      description: 'Check inbox for specific keywords and reply.',
      status: 'paused',
    },
    {
      id: '3',
      name: 'Sync Orders to Sheets',
      description: 'Monitor WooCommerce and update Google Sheets.',
      status: 'active',
    },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Workflows</PageTitle>
            <PageDescription>Create and manage automated tasks.</PageDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="btn-import-workflow">
              Import JSON
            </Button>
            <Button data-testid="btn-create-workflow">Create Workflow</Button>
          </div>
        </div>
      </PageHeader>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="grid-workflow-list"
      >
        {workflows.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-xl m-4 bg-muted/10 animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-4 rounded-full bg-primary/10 p-4 ring-1 ring-primary/20 shadow-inner">
              <WorkflowIcon className="h-8 w-8 text-primary/70" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">No workflows yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
              Create your first automated workflow to start scraping data or syncing between apps.
            </p>
            <Button className="shadow-sm">Create Workflow</Button>
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
                  <CardTitle className="text-base">{wf.name}</CardTitle>
                  <Badge
                    variant={wf.status === 'active' ? 'default' : 'secondary'}
                    className={
                      wf.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 font-medium'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 font-medium'
                    }
                  >
                    {wf.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">{wf.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-4 flex justify-between border-t mt-4">
                <div className="text-xs text-muted-foreground flex items-center">
                  <CheckCircle2Icon className="h-3 w-3 mr-1 text-green-500" /> Last run: 2h ago
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500">
                    <PlayIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid={`btn-edit-workflow-${wf.id}`}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    data-testid={`btn-delete-workflow-${wf.id}`}
                    onClick={() => setWorkflowToDelete(wf.id)}
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
              Are you sure you want to delete this workflow? This action cannot be undone and will
              permanently remove all associated execution history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setWorkflowToDelete(null)}>
              Delete Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
