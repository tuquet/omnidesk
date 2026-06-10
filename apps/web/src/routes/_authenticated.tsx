import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/app/layout';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <AppLayout />;
}
