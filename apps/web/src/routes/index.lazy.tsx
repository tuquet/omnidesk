import { createLazyFileRoute, Navigate } from '@tanstack/react-router';
import { usePlatform } from '@omnidesk/core';
import { DesktopLanding } from '@omnidesk/ui';
import { WebLanding } from '@omnidesk/ui';
import { useAuth } from '@omnidesk/auth';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const platformApi = usePlatform();



  if (platformApi.platform === 'desktop') {
    return <DesktopLanding />;
  }

  return <WebLanding isAuthenticated={isAuthenticated} />;
}
