import { createLazyFileRoute } from '@tanstack/react-router';
import { WordPressSyncAppPage } from '@/features/wordpress-sync';

export const Route = createLazyFileRoute('/_authenticated/wordpress-sync')({
  component: WordPressSyncAppPage,
});
