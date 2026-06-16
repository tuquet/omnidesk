import { createFileRoute, redirect } from '@tanstack/react-router';
import { SignupForm } from '@omnidesk/app-auth';
import { authStore } from '@omnidesk/app-auth';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config';

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    const auth = authStore.state;
    if (auth.session) {
      throw redirect({ to: DEFAULT_AUTHENTICATED_ROUTE });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
