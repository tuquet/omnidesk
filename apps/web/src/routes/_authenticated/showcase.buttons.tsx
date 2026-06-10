import { createFileRoute } from '@tanstack/react-router';
import { ButtonsShowcase } from '@/features/showcase/buttons-page';

export const Route = createFileRoute('/_authenticated/showcase/buttons')({
  component: ButtonsShowcase,
});
