import { createFileRoute, redirect } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: ({ context }) => {
    if (context.auth.role !== 'GUEST') {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
