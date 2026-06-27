import { createFileRoute } from '@tanstack/react-router';
import { Error500Page } from '@omnidesk/features';

export const Route = createFileRoute('/500')({
  component: Error500Page,
});
