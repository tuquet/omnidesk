import { createLazyFileRoute } from '@tanstack/react-router';
import { AppStore } from '@/features/launcher/components/app-store';

export const Route = createLazyFileRoute('/_authenticated/app-store')({
  component: AppStore,
});
