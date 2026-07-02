import { createFileRoute, redirect } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@omnidesk/auth';
import { authStore } from '@omnidesk/auth';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: () => {
    const auth = authStore.state;
    const hasLoggedIn = !!auth.session || !!auth.displayName;
    if (hasLoggedIn) {
      throw redirect({ to: DEFAULT_AUTHENTICATED_ROUTE });
    }
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 w-full items-center justify-center p-3">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
