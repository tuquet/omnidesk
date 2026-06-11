import { createLazyFileRoute } from '@tanstack/react-router';
import { ButtonsShowcase } from '@/features/showcase/buttons-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/buttons')({
  component: ButtonsShowcase,
});
