import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@omnidesk/core';
import { useBrowserProfileStore } from '@omnidesk/browser-profiles';

export function useBrowserEvents() {
  const { fetchProfiles } = useBrowserProfileStore();
  const [downloadProgress, setDownloadProgress] = useState<{
    status: string;
    percentage: number | null;
  } | null>(null);

  // Server-Sent Events for download progress
  useEffect(() => {
    let evtSource: EventSource | null = null;

    const initSSE = async () => {
      try {
        evtSource = new EventSource(`${API_BASE_URL}/api/browser-profiles/download-status`);

        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as { status?: string; [key: string]: unknown };
            if (data && data.status) {
              setDownloadProgress((prev) => {
                if (prev?.status === 'done' && data.status === 'done') {
                  return prev;
                }
                // @ts-expect-error valid type assignment
                return data;
              });

              if (data.status === 'done') {
                evtSource?.close();
                setTimeout(() => setDownloadProgress(null), 3000);
              }
            }
          } catch (e) {
            console.error('SSE parsing error', e);
          }
        };

        evtSource.onerror = () => {
          evtSource?.close();
          setDownloadProgress(null);
        };
      } catch (e) {
        console.error('Failed to init SSE', e);
      }
    };

    initSSE();

    return () => {
      if (evtSource) {
        evtSource.close();
      }
    };
  }, []);

  // Tauri IPC events for process status changes
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Dynamic import to prevent crash in non-Tauri environments
    import('@tauri-apps/api/event')
      .then(({ listen }) => {
        listen('profile-status-changed', (event) => {
          console.warn('Profile status changed event received', event);
          fetchProfiles();
        }).then((u) => {
          unlisten = u;
        });
      })
      .catch((_e) => {
        console.warn('Not in Tauri context, skipping event listener');
      });

    return () => {
      if (unlisten) unlisten();
    };
  }, [fetchProfiles]);

  return { downloadProgress };
}
