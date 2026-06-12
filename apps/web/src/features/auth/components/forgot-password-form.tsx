import { cn } from '@omnidesk/ui';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button, Field, FieldDescription, FieldGroup, FieldLabel, Input } from '@omnidesk/ui';

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'form'>) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Password reset link sent! Check your email.');
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <Button type="submit">Send Reset Link</Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Remember your password?{' '}
            <Link to="/login" className="underline underline-offset-4">
              Back to Login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
