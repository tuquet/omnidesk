import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/app/layout';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (context.auth.role === 'GUEST' && !context.auth.token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <AppLayout />;
}
