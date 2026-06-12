import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@omnidesk/ui';
import { SearchIcon, DatabaseIcon, HardDriveIcon, LayersIcon, ClockIcon } from 'lucide-react';

const dataItems = [
  {
    name: 'Customer Analytics 2024',
    type: 'Dataset' as const,
    size: '2.4 GB',
    records: '1.2M records',
    modified: 'Jun 8, 2026',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    tags: ['production', 'v2.1', 'verified'],
  },
  {
    name: 'Sales Forecast Model',
    type: 'Model' as const,
    size: '890 MB',
    records: '450K records',
    modified: 'Jun 5, 2026',
    owner: 'James Rodriguez',
    ownerInitials: 'JR',
    tags: ['staging', 'v3.0', 'ml'],
  },
  {
    name: 'User Behavior Dataset',
    type: 'Dataset' as const,
    size: '5.1 GB',
    records: '3.8M records',
    modified: 'Jun 3, 2026',
    owner: 'Emily Park',
    ownerInitials: 'EP',
    tags: ['production', 'automated'],
  },
  {
    name: 'Product Catalog v3',
    type: 'Dataset' as const,
    size: '340 MB',
    records: '28K records',
    modified: 'May 29, 2026',
    owner: 'Michael Torres',
    ownerInitials: 'MT',
    tags: ['v3.2', 'synced'],
  },
  {
    name: 'ML Training Pipeline',
    type: 'Pipeline' as const,
    size: '1.7 GB',
    records: '920K records',
    modified: 'Jun 1, 2026',
    owner: 'Aisha Patel',
    ownerInitials: 'AP',
    tags: ['automated', 'gpu', 'nightly'],
  },
  {
    name: 'Revenue Dashboard Data',
    type: 'Dataset' as const,
    size: '680 MB',
    records: '2.1M records',
    modified: 'Jun 7, 2026',
    owner: 'David Kim',
    ownerInitials: 'DK',
    tags: ['production', 'real-time'],
  },
];

const typeIcon = (type: string) => {
  switch (type) {
    case 'Dataset':
      return DatabaseIcon;
    case 'Model':
      return HardDriveIcon;
    case 'Pipeline':
      return LayersIcon;
    default:
      return DatabaseIcon;
  }
};

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case 'Dataset':
      return 'default' as const;
    case 'Model':
      return 'secondary' as const;
    case 'Pipeline':
      return 'outline' as const;
    default:
      return 'default' as const;
  }
};

function DataCard({ item }: { item: (typeof dataItems)[number] }) {
  const Icon = typeIcon(item.type);

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-xs">
              <span>{item.size}</span>
              <span>·</span>
              <span>{item.records}</span>
            </CardDescription>
          </div>
        </div>
        <Badge variant={typeBadgeVariant(item.type)}>{item.type}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">{item.ownerInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{item.owner}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3" />
              <span>{item.modified}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataLibraryPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Library</h1>
        <p className="text-muted-foreground">Browse and manage your data collections.</p>
      </div>

      <Separator />

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search datasets, models, pipelines..." className="pl-9" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {dataItems.map((item) => (
              <DataCard key={item.name} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="datasets" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {dataItems
              .filter((item) => item.type === 'Dataset')
              .map((item) => (
                <DataCard key={item.name} item={item} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {dataItems
              .filter((item) => item.type === 'Model')
              .map((item) => (
                <DataCard key={item.name} item={item} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pipelines" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {dataItems
              .filter((item) => item.type === 'Pipeline')
              .map((item) => (
                <DataCard key={item.name} item={item} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
