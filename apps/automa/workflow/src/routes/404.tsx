import { createFileRoute } from '@tanstack/react-router';
import { NotFoundPage } from '@omnidesk/features';

export const Route = createFileRoute('/404')({
  component: NotFoundPage,
});
