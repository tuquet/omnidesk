import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectDetailPage } from '@/features/projects/detail';

export const Route = createLazyFileRoute('/_authenticated/projects_/$projectId')({
  component: ProjectDetailPage,
});
