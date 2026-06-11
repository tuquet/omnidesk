import { createLazyFileRoute } from '@tanstack/react-router';
import { AnalyticsPage } from '@/features/analytics';

export const Route = createLazyFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});
