import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@omnidesk/ui';
import {
  PlusIcon,
  FileChartColumnIcon,
  ArrowDownToLineIcon,
  Share2Icon,
  ClockIcon,
  CheckCircle2Icon,
  LoaderIcon,
} from 'lucide-react';

type ReportStatus = 'Ready' | 'Processing' | 'Scheduled';
type ReportType = 'Financial' | 'Analytics' | 'Marketing' | 'Engineering' | 'Operations';

interface Report {
  name: string;
  type: ReportType;
  status: ReportStatus;
  generated: string;
  size: string;
}

const reports: Report[] = [
  {
    name: 'Q2 Revenue Analysis',
    type: 'Financial',
    status: 'Ready',
    generated: 'Jun 8, 2026 at 9:14 AM',
    size: '4.2 MB',
  },
  {
    name: 'Monthly Active Users',
    type: 'Analytics',
    status: 'Ready',
    generated: 'Jun 7, 2026 at 3:30 PM',
    size: '2.8 MB',
  },
  {
    name: 'Customer Churn Report',
    type: 'Analytics',
    status: 'Processing',
    generated: 'Jun 10, 2026 at 11:02 AM',
    size: '—',
  },
  {
    name: 'Performance Metrics',
    type: 'Engineering',
    status: 'Ready',
    generated: 'Jun 6, 2026 at 8:45 AM',
    size: '1.5 MB',
  },
  {
    name: 'SEO Audit Results',
    type: 'Marketing',
    status: 'Scheduled',
    generated: 'Jun 12, 2026 at 6:00 AM',
    size: '—',
  },
  {
    name: 'A/B Test Results',
    type: 'Marketing',
    status: 'Ready',
    generated: 'Jun 4, 2026 at 2:18 PM',
    size: '3.1 MB',
  },
  {
    name: 'Infrastructure Costs',
    type: 'Operations',
    status: 'Processing',
    generated: 'Jun 10, 2026 at 10:30 AM',
    size: '—',
  },
  {
    name: 'Sprint Velocity',
    type: 'Engineering',
    status: 'Ready',
    generated: 'Jun 9, 2026 at 5:00 PM',
    size: '890 KB',
  },
];

const statusConfig: Record<
  ReportStatus,
  { variant: 'default' | 'secondary' | 'outline'; icon: typeof CheckCircle2Icon }
> = {
  Ready: {
    variant: 'default',
    icon: CheckCircle2Icon,
  },
  Processing: {
    variant: 'secondary',
    icon: LoaderIcon,
  },
  Scheduled: {
    variant: 'outline',
    icon: ClockIcon,
  },
};

const typeBadgeVariant = (type: ReportType) => {
  switch (type) {
    case 'Financial':
      return 'default' as const;
    case 'Analytics':
      return 'secondary' as const;
    case 'Marketing':
      return 'outline' as const;
    case 'Engineering':
      return 'secondary' as const;
    case 'Operations':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};

export function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate, view, and manage analytical reports.</p>
        </div>
        <Button>
          <PlusIcon className="size-4" />
          Generate Report
        </Button>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm text-muted-foreground">Total Reports</p>
            <FileChartColumnIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground">+3</span> this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm text-muted-foreground">Processing</p>
            <LoaderIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Estimated ~15 min remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Next run: Jun 12 at 6:00 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const statusCfg = statusConfig[report.status];
                const StatusIcon = statusCfg.icon;

                return (
                  <TableRow key={report.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileChartColumnIcon className="size-4 text-muted-foreground" />
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant(report.type)}>{report.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>
                        <StatusIcon className="size-3" />
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{report.generated}</TableCell>
                    <TableCell className="text-muted-foreground">{report.size}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={report.status !== 'Ready'}
                        >
                          <ArrowDownToLineIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={report.status !== 'Ready'}
                        >
                          <Share2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
