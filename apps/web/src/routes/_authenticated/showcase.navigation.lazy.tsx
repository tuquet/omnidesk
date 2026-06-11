import { createLazyFileRoute } from '@tanstack/react-router';
import { NavigationShowcase } from '@/features/showcase/navigation-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/navigation')({
  component: NavigationShowcase,
});
