import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/app/layout';
import { authStore } from '@omnidesk/app-auth';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const auth = authStore.state;
    // Wait for auth to initialize
    if (auth.isLoading) return;
    // Redirect to login if no session
    if (!auth.session) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <AppLayout />;
}
