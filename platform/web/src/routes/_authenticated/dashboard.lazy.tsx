import { createLazyFileRoute } from '@tanstack/react-router';
import DashboardFeature from '@omnidesk/app-dashboard';

export const Route = createLazyFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return <DashboardFeature />;
}
