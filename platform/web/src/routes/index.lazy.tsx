import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@omnidesk/ui';
import { useAuth } from '@omnidesk/app-auth';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
        Welcome to OmniDesk
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Your unified workspace for productivity and communication. 
        Experience the power of cross-platform integration today.
      </p>
      
      <div className="flex gap-4">
        {isAuthenticated ? (
          <Button asChild size="lg">
            <Link to="/app/$appId" params={{ appId: "dashboard" }}>
              Go to Dashboard
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link to="/login">Login to Workspace</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/signup">Create Account</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
