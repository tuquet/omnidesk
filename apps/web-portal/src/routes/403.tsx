import { createFileRoute } from '@tanstack/react-router';
import { Error403Page } from '@omnidesk/features';

export const Route = createFileRoute('/403')({
  component: Error403Page,
});
