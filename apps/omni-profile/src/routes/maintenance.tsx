import { createFileRoute } from '@tanstack/react-router';
import { MaintenancePage } from '@omnidesk/features';

export const Route = createFileRoute('/maintenance')({
  component: MaintenancePage,
});
