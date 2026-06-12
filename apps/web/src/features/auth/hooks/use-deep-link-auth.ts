import { useEffect } from 'react';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { listen } from '@tauri-apps/api/event';
import { isDesktop } from '@/utils/platform';

export function useDeepLinkAuth() {
  useEffect(() => {
    if (!isDesktop()) return;

    let unlistenDeepLink: () => void;
    let unlistenCustom: () => void;

    async function setupDeepLink() {
      try {
        // Standard Tauri v2 deep link listener
        unlistenDeepLink = await onOpenUrl((urls) => {
          for (const url of urls) {
            processDeepLink(url);
          }
        });

        // Custom listener for single-instance forwarding
        unlistenCustom = await listen<string>('deep-link-received', (event) => {
          processDeepLink(event.payload);
        });
      } catch (err) {
        console.error('Failed to setup deep link listener', err);
      }
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
      if (unlistenCustom) unlistenCustom();
    };
  }, []);
}
