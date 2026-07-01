import { useState } from 'react';
import { usePlatform } from '../providers/platform-provider';
import { Button } from '@omnidesk/ui';;
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function UpdaterButton() {
  const [isChecking, setIsChecking] = useState(false);
  const platformApi = usePlatform();

  async function checkForUpdates() {
    setIsChecking(true);
    try {
      const update = await platformApi.checkUpdate() as {
        version: string;
        body?: string;
        downloadAndInstall: (onEvent: (event: { event: string }) => void) => Promise<void>;
      } | null | undefined;

      if (update) {
        toast.info(`Found update ${update.version}`, {
          description: update.body ?? 'A new version is available.',
          action: {
            label: 'Install',
            onClick: async () => {
              const toastId = toast.loading('Downloading update...');
              await update.downloadAndInstall((event: { event: string }) => {
                switch (event.event) {
                  case 'Finished':
                    toast.success('Download complete! Relaunching...', { id: toastId });
                    break;
                }
              });
              await platformApi.relaunchApp();
            },
          },
        });
      } else {
        toast.success('You are on the latest version.');
      }
    } finally {
      setIsChecking(false);
    }
  }

  if (platformApi.platform !== 'desktop') {
    return null;
  }

  return (
    <Button variant="outline" size="sm" onClick={checkForUpdates} disabled={isChecking}>
      <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
      Check for Updates
    </Button>
  );
}
