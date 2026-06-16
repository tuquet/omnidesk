import { createLazyFileRoute } from '@tanstack/react-router';
import { AnalyticsPage } from '@omnidesk/app-analytics';

export const Route = createLazyFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});
