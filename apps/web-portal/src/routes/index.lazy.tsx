import { createLazyFileRoute } from '@tanstack/react-router';
import { usePlatform } from '@omnidesk/core';
import { DesktopLanding } from '@omnidesk/features';;
import { WebLanding } from '@omnidesk/features';;
import { useAuth } from '@omnidesk/auth';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const platformApi = usePlatform();

  if (platformApi.platform === 'desktop') {
    return <DesktopLanding isAuthenticated={isAuthenticated} />;
  }

  return <WebLanding />;
}
