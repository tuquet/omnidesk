import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectDetailPage } from '@omnidesk/app-projects/detail';

export const Route = createLazyFileRoute('/_authenticated/projects_/$projectId')({
  component: ProjectDetailPage,
});
