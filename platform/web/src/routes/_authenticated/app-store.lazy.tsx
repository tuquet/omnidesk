import { createLazyFileRoute } from '@tanstack/react-router';
import { AppStore } from '@omnidesk/app-launcher';

export const Route = createLazyFileRoute('/_authenticated/app-store')({
  component: AppStore,
});
