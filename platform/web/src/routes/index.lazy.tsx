import { createLazyFileRoute, Navigate } from '@tanstack/react-router';
import { Platform } from '@/lib/platform';
import { DesktopLanding } from '@/components/landing/desktop-landing';
import { WebLanding } from '@/components/landing/web-landing';
import { useAuth } from '@omnidesk/app-auth';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app/$appId" params={{ appId: 'home' }} replace />;
  }

  if (Platform.isDesktop) {
    return <DesktopLanding />;
  }

  return <WebLanding />;
}
