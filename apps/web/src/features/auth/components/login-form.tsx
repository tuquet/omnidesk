import { cn } from "@kbm/ui"
import { Link, useNavigate } from "@tanstack/react-router"
import { UserRound, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/config/route-config'
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  Input,
} from "@kbm/ui"
import { authActions } from "../stores/use-auth-store"
import { loginFormSchema } from "../schemas"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: 'admin@kbm.com',
      password: 'password',
    },
    onSubmit: async ({ value }) => {
      try {
        await authActions.signInWithPassword(value.email, value.password);
        toast.success('Login successful!');
        navigate({ to: DEFAULT_AUTHENTICATED_ROUTE });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        toast.error(message);
      }
    },
  });

  const handleGitHubLogin = async () => {
    try {
      await authActions.signInWithGitHub();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub login failed';
      toast.error(message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await authActions.signInAnonymously();
      toast.success('Logged in as Guest');
      navigate({ to: DEFAULT_AUTHENTICATED_ROUTE });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Guest login failed';
      toast.error(message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>

          <form.Field
            name="email"
            validators={{
              onBlur: loginFormSchema.shape.email,
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(
                    "bg-background",
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onBlur: loginFormSchema.shape.password,
            }}
          >
            {(field) => (
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ms-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(
                    "bg-background",
                    field.state.meta.errors.length > 0 && "border-destructive"
                  )}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          <Field>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Signing in...' : 'Login'}
                </Button>
              )}
            </form.Subscribe>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>
          <Field>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" type="button" onClick={handleGitHubLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                GitHub
              </Button>
              <Button variant="outline" type="button" onClick={handleGuestLogin}>
                <UserRound className="h-4 w-4" />
                Guest
              </Button>
            </div>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
