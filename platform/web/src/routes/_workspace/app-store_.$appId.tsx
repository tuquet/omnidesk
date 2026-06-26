import { createFileRoute } from '@tanstack/react-router';
import { AppDetailPage } from '@omnidesk/app-launcher/pages/app-detail-page';

export const Route = createFileRoute('/_workspace/app-store_/$appId')({
  component: AppDetailPage,
});
