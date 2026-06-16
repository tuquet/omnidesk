import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectsPage } from '@omnidesk/app-projects';

export const Route = createLazyFileRoute('/_authenticated/projects')({
  component: ProjectsPage,
});
