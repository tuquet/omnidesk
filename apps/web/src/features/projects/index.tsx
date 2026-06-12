import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Separator,
} from '@omnidesk/ui';
import { ProgressBar } from '@/components/progress-bar';
import { PlusIcon, FolderIcon, ClockIcon, UsersIcon } from 'lucide-react';

const projects = [
  {
    name: 'Website Redesign',
    description:
      'Complete overhaul of the corporate website with modern design patterns and improved UX.',
    status: 'Active' as const,
    progress: 72,
    team: ['JD', 'AS', 'MK'],
    extra: 3,
    lastUpdated: 'Jun 10, 2026',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  {
    name: 'Mobile App v2',
    description:
      'Second major release of the mobile application with offline support and push notifications.',
    status: 'Active' as const,
    progress: 45,
    team: ['ER', 'PP'],
    extra: 2,
    lastUpdated: 'Jun 9, 2026',
    tags: ['React Native', 'TypeScript'],
  },
  {
    name: 'API Migration',
    description:
      'Migrate legacy REST endpoints to a new GraphQL-based API layer with improved caching.',
    status: 'Planning' as const,
    progress: 12,
    team: ['DK', 'LA', 'JW'],
    extra: 1,
    lastUpdated: 'Jun 8, 2026',
    tags: ['Rust', 'GraphQL', 'Docker'],
  },
  {
    name: 'Design System',
    description: 'Build a unified component library and design token system for all product teams.',
    status: 'Active' as const,
    progress: 88,
    team: ['MG', 'ET'],
    extra: 0,
    lastUpdated: 'Jun 10, 2026',
    tags: ['React', 'Storybook', 'Figma'],
  },
  {
    name: 'E-commerce Platform',
    description:
      'Full-stack e-commerce solution with inventory management, payments, and analytics dashboard.',
    status: 'On Hold' as const,
    progress: 34,
    team: ['SC', 'AR', 'PP'],
    extra: 4,
    lastUpdated: 'May 28, 2026',
    tags: ['Python', 'PostgreSQL', 'Stripe'],
  },
  {
    name: 'Data Pipeline',
    description:
      'Real-time data ingestion and transformation pipeline for business intelligence reporting.',
    status: 'Completed' as const,
    progress: 100,
    team: ['LA', 'DK'],
    extra: 1,
    lastUpdated: 'Jun 5, 2026',
    tags: ['Rust', 'Kafka', 'ClickHouse'],
  },
];

function getStatusVariant(status: string) {
  switch (status) {
    case 'Active':
      return 'default' as const;
    case 'Planning':
      return 'secondary' as const;
    case 'On Hold':
      return 'outline' as const;
    case 'Completed':
      return 'default' as const;
    default:
      return 'default' as const;
  }
}

export function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects in one place.</p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.name} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderIcon className="text-muted-foreground h-5 w-5" />
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                </div>
                <Badge
                  variant={getStatusVariant(project.status)}
                  className={
                    project.status === 'Completed' ? 'bg-green-600 hover:bg-green-700' : ''
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <CardDescription className="pt-1">{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} className="h-2" />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Footer: Team + Last Updated */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <UsersIcon className="text-muted-foreground mr-1 h-4 w-4" />
                  <div className="flex -space-x-2">
                    {project.team.map((initials) => (
                      <Avatar key={initials} className="border-background h-7 w-7 border-2">
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                    ))}
                    {project.extra > 0 && (
                      <Avatar className="border-background h-7 w-7 border-2">
                        <AvatarFallback className="text-[10px]">+{project.extra}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <ClockIcon className="h-3 w-3" />
                  {project.lastUpdated}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
