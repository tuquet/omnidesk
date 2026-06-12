import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@omnidesk/ui';
import { ProgressBar } from '@/components/progress-bar';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  GlobeIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  TrendingUpIcon,
} from 'lucide-react';

const summaryStats = [
  {
    title: 'Page Views',
    value: '284,921',
    change: '+12.5%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Unique Visitors',
    value: '52,831',
    change: '+8.2%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Bounce Rate',
    value: '32.4%',
    change: '-3.1%',
    trend: 'down' as const,
    description: 'vs. previous period',
  },
  {
    title: 'Avg. Session',
    value: '4m 32s',
    change: '+0.8%',
    trend: 'up' as const,
    description: 'vs. previous period',
  },
];

const trafficSources = [
  {
    source: 'Organic Search',
    type: 'organic',
    visitors: '23,841',
    bounceRate: '28.3%',
    avgDuration: '5m 12s',
  },
  {
    source: 'Direct',
    type: 'direct',
    visitors: '14,205',
    bounceRate: '35.7%',
    avgDuration: '3m 48s',
  },
  {
    source: 'Social Media',
    type: 'social',
    visitors: '8,932',
    bounceRate: '42.1%',
    avgDuration: '2m 55s',
  },
  {
    source: 'Referral',
    type: 'referral',
    visitors: '4,117',
    bounceRate: '25.9%',
    avgDuration: '6m 03s',
  },
  {
    source: 'Email',
    type: 'email',
    visitors: '1,736',
    bounceRate: '19.4%',
    avgDuration: '7m 21s',
  },
];

const topPages = [
  { page: '/dashboard', views: '42,318', unique: '28,491' },
  { page: '/products', views: '31,205', unique: '22,847' },
  { page: '/blog/getting-started', views: '18,924', unique: '15,302' },
  { page: '/pricing', views: '14,671', unique: '11,983' },
  { page: '/docs/api-reference', views: '9,847', unique: '7,621' },
];

const deviceBreakdown = [
  {
    device: 'Desktop',
    percentage: 64,
    icon: MonitorIcon,
  },
  {
    device: 'Mobile',
    percentage: 28,
    icon: SmartphoneIcon,
  },
  {
    device: 'Tablet',
    percentage: 8,
    icon: TabletIcon,
  },
];

const sourceBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  organic: 'default',
  direct: 'secondary',
  social: 'outline',
  referral: 'secondary',
  email: 'outline',
};

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Monitor performance metrics and insights.</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <TrendingUpIcon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {stat.title === 'Bounce Rate' ? (
                  <>
                    <ArrowDownIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{stat.change}</span>
                  </>
                ) : stat.trend === 'up' ? (
                  <>
                    <ArrowUpIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{stat.change}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{stat.change}</span>
                  </>
                )}
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GlobeIcon className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Bounce Rate</TableHead>
                <TableHead className="text-right">Avg. Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trafficSources.map((source) => (
                <TableRow key={source.source}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={sourceBadgeVariant[source.type]}>{source.source}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{source.visitors}</TableCell>
                  <TableCell className="text-right">{source.bounceRate}</TableCell>
                  <TableCell className="text-right">{source.avgDuration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages this period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Unique Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((page) => (
                  <TableRow key={page.page}>
                    <TableCell className="font-mono text-sm">{page.page}</TableCell>
                    <TableCell className="text-right font-medium">{page.views}</TableCell>
                    <TableCell className="text-right">{page.unique}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Traffic distribution across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {deviceBreakdown.map((device) => (
                <div key={device.device} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <device.icon className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm font-medium">{device.device}</span>
                    </div>
                    <span className="text-sm font-bold">{device.percentage}%</span>
                  </div>
                  <ProgressBar value={device.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
