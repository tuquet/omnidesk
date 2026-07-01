import { createFileRoute } from '@tanstack/react-router';
import { PageContainer, PageHeader, PageTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button, Badge } from '@omnidesk/ui';;
import { XCircleIcon } from 'lucide-react';

export const Route = createFileRoute('/active-jobs')({
  component: ActiveJobsPage,
});

function ActiveJobsPage() {
  const jobs = [
    { id: 'job_123', workflow: 'Scrape Daily News', profile: 'Main FB Account', status: 'running', duration: '12m 30s' },
    { id: 'job_124', workflow: 'Auto Reply Emails', profile: 'Google Ads 01', status: 'running', duration: '2m 15s' },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Active Jobs & Queue</PageTitle>
              </PageHeader>
      
      <div className="rounded-md border bg-card">
        <Table data-testid="table-active-jobs">
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.workflow}</TableCell>
                <TableCell className="text-muted-foreground">{job.profile}</TableCell>
                <TableCell>{job.duration}</TableCell>
                <TableCell>
                  <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`btn-kill-job-${job.id}`}>
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No active jobs running
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
