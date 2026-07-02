import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@omnidesk/auth';
import { authStore } from '@omnidesk/auth';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const auth = authStore.state;
    if (auth.session) {
      throw redirect({ to: DEFAULT_AUTHENTICATED_ROUTE });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex flex-1 w-full items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
