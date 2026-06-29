import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@omnidesk/core';
import { browserProfileStore } from '@omnidesk/browser-profiles';

export function useBrowserEvents() {
  // No longer extracting fetchProfiles as it is unused
  const [downloadProgress, setDownloadProgress] = useState<{
    status: string;
    percent: number | null;
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
                return data as { status: string; percent: number | null };
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
          const payload = event.payload as { id: string; status: string; last_used_at?: string };

          if (payload && payload.id) {
            browserProfileStore.setState((s) => ({
              ...s,
              profiles: s.profiles.map((p) =>
                p.id === payload.id
                  ? {
                      ...p,
                      status: payload.status,
                      last_used_at:
                        payload.last_used_at ||
                        (payload.status === 'RUNNING' ? new Date().toISOString() : p.last_used_at),
                      pid: payload.status === 'RUNNING' ? 1 : null,
                    }
                  : p,
              ),
            }));
          }
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
  }, []);

  return { downloadProgress };
}
