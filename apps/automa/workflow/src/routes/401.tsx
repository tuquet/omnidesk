import { createFileRoute } from '@tanstack/react-router';
import { Error401Page } from '@omnidesk/features';

export const Route = createFileRoute('/401')({
  component: Error401Page,
});
