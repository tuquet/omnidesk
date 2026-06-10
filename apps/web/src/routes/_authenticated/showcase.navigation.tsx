import { createFileRoute } from '@tanstack/react-router';
import { NavigationShowcase } from '@/features/showcase/navigation-page';

export const Route = createFileRoute('/_authenticated/showcase/navigation')({
  component: NavigationShowcase,
});
