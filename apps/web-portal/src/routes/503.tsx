import { createFileRoute } from '@tanstack/react-router';
import { Error503Page } from '@omnidesk/features';

export const Route = createFileRoute('/503')({
  component: Error503Page,
});
