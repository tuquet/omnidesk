import { createLazyFileRoute } from '@tanstack/react-router';
import DashboardFeature from '@/features/dashboard';

export const Route = createLazyFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return <DashboardFeature />;
}
