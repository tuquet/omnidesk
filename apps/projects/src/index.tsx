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
import { PlusIcon, FolderIcon, ClockIcon, UsersIcon, ExternalLink } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { projects, getStatusVariant } from './api/mock-projects';

export default function ProjectsPage() {
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
                {project.id === 'nhaatelier' ? (
                  <Button size="sm" variant="outline" asChild className="gap-1.5">
                    <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                      Manage Sync
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <ClockIcon className="h-3 w-3" />
                    {project.lastUpdated}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
