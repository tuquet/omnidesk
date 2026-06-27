import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, PageDescription, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '@omnidesk/ui';
import { PlayIcon, EditIcon, CheckCircle2Icon } from 'lucide-react';

export const Route = createFileRoute('/workflows')({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const workflows = [
    { id: '1', name: 'Scrape Daily News', description: 'Runs every morning at 8AM to fetch tech news.', status: 'active' },
    { id: '2', name: 'Auto Reply Emails', description: 'Check inbox for specific keywords and reply.', status: 'paused' },
    { id: '3', name: 'Sync Orders to Sheets', description: 'Monitor WooCommerce and update Google Sheets.', status: 'active' },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Workflows</PageTitle>
            <PageDescription>Create and manage automated tasks.</PageDescription>
          </div>
          <Button>Import JSON</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map(wf => (
          <Card key={wf.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{wf.name}</CardTitle>
                <Badge variant={wf.status === 'active' ? 'default' : 'secondary'} className={wf.status === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}>
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
                <Button variant="ghost" size="icon" className="h-8 w-8"><EditIcon className="h-4 w-4" /></Button>
                <Button variant="default" size="icon" className="h-8 w-8"><PlayIcon className="h-4 w-4" /></Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
