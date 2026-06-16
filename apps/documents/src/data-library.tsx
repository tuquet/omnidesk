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
import { SearchIcon, ClockIcon } from 'lucide-react';
import { dataItems, typeIcon, typeBadgeVariant } from './config/constants';

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
