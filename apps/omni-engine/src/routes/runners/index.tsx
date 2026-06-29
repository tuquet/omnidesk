import { createFileRoute, Link } from '@tanstack/react-router';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
} from '@omnidesk/ui';
import { Clock, PlayCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/runners/')({
  component: RunnersPage,
});

const MOCK_RUNNERS = [
  {
    id: 'br-1045',
    workflowName: 'Daily Lead Scraping',
    status: 'running',
    profilesCount: 12,
    startTime: '10 mins ago',
    endTime: '-',
  },
  {
    id: 'br-1044',
    workflowName: 'Social Media Engagement',
    status: 'completed',
    profilesCount: 5,
    startTime: '2 hours ago',
    endTime: '1 hour ago',
  },
  {
    id: 'br-1043',
    workflowName: 'Competitor Analysis',
    status: 'failed',
    profilesCount: 3,
    startTime: '5 hours ago',
    endTime: '4.5 hours ago',
  },
  {
    id: 'br-1042',
    workflowName: 'Warmup Sequence',
    status: 'completed',
    profilesCount: 20,
    startTime: '1 day ago',
    endTime: '1 day ago',
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'running':
      return <PlayCircle className="w-4 h-4 text-primary animate-pulse" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'running':
      return <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Running</Badge>;
    case 'completed':
      return <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-none">Failed</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

function RunnersPage() {
  return (
    <PageContainer className="bg-background">
      <PageHeader className="pb-8">
        <div>
          <PageTitle className="tracking-tight text-3xl font-bold">Batch Runners</PageTitle>
          <div className="text-base text-muted-foreground mt-2">
            Monitor and manage your workflow execution batches.
          </div>
        </div>
      </PageHeader>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px] font-semibold">Runner ID</TableHead>
                <TableHead className="font-semibold">Workflow</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Profiles</TableHead>
                <TableHead className="font-semibold">Started</TableHead>
                <TableHead className="font-semibold">Ended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RUNNERS.map((runner) => (
                <TableRow key={runner.id} className="group hover:bg-muted/40 cursor-pointer transition-colors">
                  <TableCell className="font-medium">
                    <Link to="/runners/$runnerId" params={{ runnerId: runner.id }} className="flex items-center text-primary group-hover:underline">
                      {runner.id}
                    </Link>
                  </TableCell>
                  <TableCell>{runner.workflowName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(runner.status)}
                      {getStatusBadge(runner.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background">
                      {runner.profilesCount} targets
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {runner.startTime}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{runner.endTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
