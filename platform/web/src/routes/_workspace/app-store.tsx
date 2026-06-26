import { createFileRoute } from '@tanstack/react-router';
import { AppStore } from '@omnidesk/app-launcher';

export const Route = createFileRoute('/_workspace/app-store')({
  component: AppStore,
});
