import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectsPage } from '@/features/projects';

export const Route = createLazyFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
});
