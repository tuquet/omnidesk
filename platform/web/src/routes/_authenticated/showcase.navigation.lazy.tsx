import { createLazyFileRoute } from '@tanstack/react-router';
import { NavigationShowcase } from '@omnidesk/app-showcase/navigation-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/navigation')({
  component: NavigationShowcase,
});
