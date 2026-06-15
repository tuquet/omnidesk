import { createFileRoute } from '@tanstack/react-router';
import { AppDetailPage } from '@/features/launcher/pages/app-detail-page';

export const Route = createFileRoute('/_authenticated/app-store_/$appId')({
  component: AppDetailPage,
});
