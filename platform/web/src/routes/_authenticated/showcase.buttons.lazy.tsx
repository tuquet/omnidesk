import { createLazyFileRoute } from '@tanstack/react-router';
import { ButtonsShowcase } from '@omnidesk/app-showcase/buttons-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/buttons')({
  component: ButtonsShowcase,
});
