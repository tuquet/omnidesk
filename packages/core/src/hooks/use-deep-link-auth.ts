import { useEffect } from 'react';
import { usePlatform } from '../providers/platform-provider';

export function useDeepLinkAuth() {
  const platformApi = usePlatform();

  useEffect(() => {
    if (platformApi.platform !== 'desktop') return;

    let unlistenDeepLink: () => void;

    async function setupDeepLink() {
      unlistenDeepLink = await platformApi.listenToDeepLink((urls) => {
        for (const url of urls) {
          processDeepLink(url);
        }
      });
    }

    function processDeepLink(url: string) {
      try {
        const parsedUrl = new URL(url);

        // Our custom scheme is configured as omnidesk://
        // Redirects will come as omnidesk://auth/callback?code=...
        if (parsedUrl.host === 'auth' && parsedUrl.pathname.includes('callback')) {
          // Reconstruct the path by combining the host (auth) and pathname (/callback)
          const targetUrl =
            window.location.origin +
            '/' +
            parsedUrl.host +
            parsedUrl.pathname +
            parsedUrl.search +
            parsedUrl.hash;
          console.log('DEEP LINK RECEIVED:', url, 'TARGET URL:', targetUrl);

          // Assign to window.location to trigger a full navigation
          // This ensures the Supabase client automatically picks up the URL parameters
          // exactly as if the browser had redirected back.
          window.location.assign(targetUrl);
        }
      } catch (err) {
        console.error('Failed to parse deep link URL', err);
      }
    }

    setupDeepLink();

    return () => {
      if (unlistenDeepLink) unlistenDeepLink();
    };
  }, []);
}
